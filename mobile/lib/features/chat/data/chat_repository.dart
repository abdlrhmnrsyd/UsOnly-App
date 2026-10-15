import 'dart:async';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/socket_service.dart';
import '../domain/message_model.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final socket = ref.watch(socketServiceProvider);
  return ChatRepository(client, socket);
});

class ChatRepository {
  final ApiClient _client;
  final SocketService _socket;
  final StreamController<List<MessageModel>> _messagesStreamController =
      StreamController<List<MessageModel>>.broadcast();
  final List<MessageModel> _inMemoryMessages = [];
  Timer? _pollingTimer;

  ChatRepository(this._client, this._socket) {
    _socket.onMessage.listen((json) {
      final msg = MessageModel.fromJson(json);
      _inMemoryMessages.insert(0, msg);
      _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
    });
  }

  Stream<List<MessageModel>> watchMessages(String conversationId, {int limit = 50}) {
    fetchMessages();
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) => fetchMessages());
    return _messagesStreamController.stream;
  }

  Future<List<MessageModel>> fetchMessages() async {
    try {
      final res = await _client.get('/messages');
      if (res['messages'] is List) {
        final list = (res['messages'] as List)
            .map((item) => MessageModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
        _inMemoryMessages.clear();
        _inMemoryMessages.addAll(list);
        _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
        return list;
      }
    } catch (_) {}
    return _inMemoryMessages;
  }

  Future<List<MessageModel>> getMessages() async {
    return await fetchMessages();
  }

  Future<MessageModel> sendTextMessage(String text) async {
    final res = await _client.post('/messages', {
      'content': text.trim(),
      'message_type': 'text',
    });

    final msg = MessageModel.fromJson(Map<String, dynamic>.from(res['message'] ?? res));
    _socket.emitNewMessage(msg.toJson());
    _inMemoryMessages.insert(0, msg);
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
    final res = await _client.post('/messages', {
      'content': content,
      'media_url': mediaUrl,
      'message_type': type,
    });

    final msg = MessageModel.fromJson(Map<String, dynamic>.from(res['message'] ?? res));
    _socket.emitNewMessage(msg.toJson());
    _inMemoryMessages.insert(0, msg);
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
      type: 'pap',
      mediaUrl: mediaUrl,
    );
  }

  Future<MessageModel> sendMediaMessage({
    required File file,
    String? caption,
    required String type,
  }) async {
    final fileUrl = await _client.uploadPhoto(file);

    final res = await _client.post('/messages', {
      'content': caption ?? (type == 'pap' ? '📸 PAP Kilat' : 'Foto dikirim'),
      'media_url': fileUrl,
      'message_type': type,
    });

    final msg = MessageModel.fromJson(Map<String, dynamic>.from(res['message'] ?? res));
    _socket.emitNewMessage(msg.toJson());
    _inMemoryMessages.insert(0, msg);
    _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
    return msg;
  }

  Future<MessageModel> sendLocationMessage({
    required double latitude,
    required double longitude,
    required String placeLabel,
    String? conversationId,
    String? senderUid,
  }) async {
    final res = await _client.post('/messages', {
      'content': '📍 $placeLabel',
      'media_url': null,
      'message_type': 'location',
    });

    final msg = MessageModel.fromJson(Map<String, dynamic>.from(res['message'] ?? res));
    _socket.emitNewMessage(msg.toJson());
    _inMemoryMessages.insert(0, msg);
    _messagesStreamController.add(List.unmodifiable(_inMemoryMessages));
    return msg;
  }

  Future<void> sendLovePoke({
    required String pokeType,
    required String senderNickname,
    String? customNote,
  }) async {
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
    _client.post('/messages/read').catchError((_) {});
  }
}
