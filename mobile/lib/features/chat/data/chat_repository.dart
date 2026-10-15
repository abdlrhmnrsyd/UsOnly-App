import 'dart:async';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/socket_service.dart';
import '../../media/data/storage_repository.dart';
import '../domain/message_model.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final socket = ref.watch(socketServiceProvider);
  final storage = ref.watch(storageRepositoryProvider);
  return ChatRepository(socket, storage);
});

class ChatRepository {
  final SocketService _socket;
  final StorageRepository _storage;
  SupabaseClient get _supabase => Supabase.instance.client;

  final StreamController<List<MessageModel>> _messagesStreamController =
      StreamController<List<MessageModel>>.broadcast();
  final List<MessageModel> _inMemoryMessages = [];
  Timer? _pollingTimer;

  ChatRepository(this._socket, this._storage) {
    _socket.onMessage.listen((json) {
      final msg = MessageModel.fromJson(json);
      // Append to the bottom (newest message)
      if (!_inMemoryMessages.any((m) => m.id == msg.id)) {
        _inMemoryMessages.add(msg);
        _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
      }
    });
  }

  Stream<List<MessageModel>> watchMessages(String conversationId, {int limit = 50}) {
    fetchMessages(spaceId: conversationId, limit: limit);
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => fetchMessages(spaceId: conversationId, limit: limit),
    );
    return _messagesStreamController.stream;
  }

  Future<List<MessageModel>> fetchMessages({String? spaceId, int limit = 50}) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return _inMemoryMessages;

      var query = _supabase.from('messages').select('*');
      if (spaceId != null && spaceId.isNotEmpty) {
        query = query.eq('couple_id', spaceId);
      }
      // Order chronologically (ascending: true) so oldest is at top, newest at bottom!
      final res = await query.order('created_at', ascending: true).limit(limit);

      final list = res
          .map((item) => MessageModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
      _inMemoryMessages.clear();
      _inMemoryMessages.addAll(list);
      _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
      return list;
    } catch (_) {}
    return _inMemoryMessages;
  }

  Future<List<MessageModel>> getMessages() async {
    return await fetchMessages();
  }

  Future<MessageModel> sendTextMessage(String text) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Belum login');

    final profile = await _supabase
        .from('profiles')
        .select('space_id')
        .eq('id', user.id)
        .maybeSingle();

    final spaceId = profile?['space_id']?.toString();
    if (spaceId == null || spaceId.isEmpty) {
      throw Exception('Belum terhubung dengan ruang pasangan.');
    }

    final newRow = {
      'couple_id': spaceId,
      'sender_id': user.id,
      'message_type': 'text',
      'content': text.trim(),
      'created_at': DateTime.now().toIso8601String(),
    };

    final inserted = await _supabase
        .from('messages')
        .insert(newRow)
        .select()
        .single();

    final msg = MessageModel.fromJson(Map<String, dynamic>.from(inserted));
    _socket.emitNewMessage(msg.toJson());
    if (!_inMemoryMessages.any((m) => m.id == msg.id)) {
      _inMemoryMessages.add(msg);
    }
    _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
    return msg;
  }

  Future<MessageModel> sendMessage({
    required String conversationId,
    required String senderUid,
    String? senderName,
    String? senderAvatar,
    required String content,
    String type = 'text',
    String? mediaUrl,
  }) async {
    final dbType = (type == 'pap' || type == 'image') ? 'image' : type;

    final newRow = {
      'couple_id': conversationId,
      'sender_id': senderUid,
      'message_type': dbType,
      'content': content,
      'media_url': mediaUrl,
      'created_at': DateTime.now().toIso8601String(),
    };

    final inserted = await _supabase
        .from('messages')
        .insert(newRow)
        .select()
        .single();

    final msg = MessageModel.fromJson(Map<String, dynamic>.from(inserted));
    _socket.emitNewMessage(msg.toJson());
    if (!_inMemoryMessages.any((m) => m.id == msg.id)) {
      _inMemoryMessages.add(msg);
    }
    _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
    return msg;
  }

  Future<MessageModel> sendPapMessage({
    required String conversationId,
    required String senderUid,
    required String mediaUrl,
    String? caption,
  }) async {
    return await sendMessage(
      conversationId: conversationId,
      senderUid: senderUid,
      content: caption ?? '📸 PAP Kilat',
      type: 'image',
      mediaUrl: mediaUrl,
    );
  }

  Future<MessageModel> sendMediaMessage({
    required File file,
    String? caption,
    required String type,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Belum login');

    final profile = await _supabase
        .from('profiles')
        .select('space_id')
        .eq('id', user.id)
        .maybeSingle();

    final spaceId = profile?['space_id']?.toString();
    if (spaceId == null || spaceId.isEmpty) {
      throw Exception('Belum terhubung dengan ruang pasangan.');
    }

    final fileUrl = await _storage.uploadPhoto(file);

    return await sendMessage(
      conversationId: spaceId,
      senderUid: user.id,
      content: caption ?? (type == 'pap' ? '📸 PAP Kilat' : 'Foto dikirim'),
      type: type == 'pap' ? 'image' : type,
      mediaUrl: fileUrl,
    );
  }

  Future<MessageModel> sendLocationMessage({
    required double latitude,
    required double longitude,
    required String placeLabel,
    String? conversationId,
    String? senderUid,
  }) async {
    final user = _supabase.auth.currentUser;
    final uid = senderUid ?? user?.id;
    if (uid == null) throw Exception('Belum login');

    String? spaceId = conversationId;
    if (spaceId == null || spaceId.isEmpty) {
      final profile = await _supabase
          .from('profiles')
          .select('space_id')
          .eq('id', uid)
          .maybeSingle();
      spaceId = profile?['space_id']?.toString();
    }

    if (spaceId == null || spaceId.isEmpty) {
      throw Exception('Belum terhubung dengan ruang pasangan.');
    }

    final newRow = {
      'couple_id': spaceId,
      'sender_id': uid,
      'message_type': 'location',
      'content': '📍 $placeLabel',
      'created_at': DateTime.now().toIso8601String(),
    };

    final inserted = await _supabase
        .from('messages')
        .insert(newRow)
        .select()
        .single();

    final msg = MessageModel.fromJson(Map<String, dynamic>.from(inserted));
    _socket.emitNewMessage(msg.toJson());
    if (!_inMemoryMessages.any((m) => m.id == msg.id)) {
      _inMemoryMessages.add(msg);
    }
    _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
    return msg;
  }

  Future<void> sendLovePoke({
    required String pokeType,
    required String senderNickname,
    String? customNote,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user != null) {
      final profile = await _supabase
          .from('profiles')
          .select('space_id')
          .eq('id', user.id)
          .maybeSingle();
      final spaceId = profile?['space_id']?.toString();
      if (spaceId != null) {
        await _supabase.from('messages').insert({
          'couple_id': spaceId,
          'sender_id': user.id,
          'message_type': 'poke',
          'content': customNote ?? 'Mengirim Colekan Cinta: $pokeType',
          'created_at': DateTime.now().toIso8601String(),
        }).catchError((_) {});
      }
    }

    _socket.emitLovePoke({
      'pokeType': pokeType,
      'senderNickname': senderNickname,
      'customNote': customNote,
    });
  }

  Stream<MessageModel> watchIncomingMessages() {
    return _socket.onMessage.map((json) => MessageModel.fromJson(json));
  }

  void markAsRead() {
    final user = _supabase.auth.currentUser;
    if (user == null) return;
    _supabase
        .from('messages')
        .update({'is_read': true, 'read_at': DateTime.now().toIso8601String()})
        .neq('sender_id', user.id)
        .eq('is_read', false)
        .catchError((_) {});
  }
}
