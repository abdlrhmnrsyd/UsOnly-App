import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../app/config/api_config.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService();
  ref.onDispose(() => service.disconnect());
  return service;
});

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _pokeController = StreamController<Map<String, dynamic>>.broadcast();
  final _locationController = StreamController<Map<String, dynamic>>.broadcast();
  final _partnerOnlineController = StreamController<bool>.broadcast();
  final _partnerJoinedController = StreamController<Map<String, dynamic>>.broadcast();
  final _partnerTypingController = StreamController<bool>.broadcast();

  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;
  Stream<Map<String, dynamic>> get onLovePoke => _pokeController.stream;
  Stream<Map<String, dynamic>> get onLocationUpdated => _locationController.stream;
  Stream<bool> get onPartnerOnline => _partnerOnlineController.stream;
  Stream<Map<String, dynamic>> get onPartnerJoined => _partnerJoinedController.stream;
  Stream<bool> get onPartnerTyping => _partnerTypingController.stream;

  void connect({required String spaceId, required String userId}) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('join_space', {'spaceId': spaceId, 'userId': userId});
      return;
    }

    _socket = io.io(
      ApiConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('[Socket] Connected to ${ApiConfig.socketUrl}');
      _socket!.emit('join_space', {'spaceId': spaceId, 'userId': userId});
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      debugPrint('[Socket] Disconnected');
    });

    _socket!.on('message_received', (data) {
      if (data is Map) {
        _messageController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('partner_love_poke', (data) {
      if (data is Map) {
        _pokeController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('partner_location_updated', (data) {
      if (data is Map) {
        _locationController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('partner_online', (_) => _partnerOnlineController.add(true));
    _socket!.on('partner_offline', (_) => _partnerOnlineController.add(false));

    _socket!.on('partner_joined', (data) {
      if (data is Map) {
        _partnerJoinedController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('partner_typing_start', (_) => _partnerTypingController.add(true));
    _socket!.on('partner_typing_stop', (_) => _partnerTypingController.add(false));

    _socket!.connect();
  }

  void on(String event, dynamic Function(dynamic) handler) {
    _socket?.on(event, handler);
  }

  void emit(String event, [dynamic data]) {
    _socket?.emit(event, data);
  }

  void emitNewMessage(Map<String, dynamic> msg) {
    _socket?.emit('new_message', msg);
  }

  void emitLovePoke(Map<String, dynamic> pokeData) {
    _socket?.emit('send_love_poke', pokeData);
  }

  void emitLocationUpdate(Map<String, dynamic> locationData) {
    _socket?.emit('location_update', locationData);
  }

  void emitTyping(bool isTyping, String nickname) {
    if (isTyping) {
      _socket?.emit('typing_start', {'nickname': nickname});
    } else {
      _socket?.emit('typing_stop');
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }
}
