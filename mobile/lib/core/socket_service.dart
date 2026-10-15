import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService();
  ref.onDispose(() => service.disconnect());
  return service;
});

class SocketService {
  RealtimeChannel? _channel;
  bool _isConnected = false;
  final Map<String, List<dynamic Function(dynamic)>> _customHandlers = {};

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
    if (_channel != null) {
      disconnect();
    }

    final supabase = Supabase.instance.client;
    final channelName = 'couple_space:$spaceId';

    _channel = supabase.channel(
      channelName,
      opts: const RealtimeChannelConfig(self: false),
    );

    // 1. Listen for Broadcast messages
    _channel!.onBroadcast(
      event: 'message_received',
      callback: (payload) {
        _messageController.add(Map<String, dynamic>.from(payload));
        _triggerCustomHandler('message_received', payload);
      },
    );

    _channel!.onBroadcast(
      event: 'partner_love_poke',
      callback: (payload) {
        _pokeController.add(Map<String, dynamic>.from(payload));
        _triggerCustomHandler('partner_love_poke', payload);
      },
    );

    _channel!.onBroadcast(
      event: 'partner_location_updated',
      callback: (payload) {
        _locationController.add(Map<String, dynamic>.from(payload));
        _triggerCustomHandler('partner_location_updated', payload);
      },
    );

    _channel!.onBroadcast(
      event: 'partner_typing_start',
      callback: (_) {
        _partnerTypingController.add(true);
        _triggerCustomHandler('partner_typing_start', null);
      },
    );

    _channel!.onBroadcast(
      event: 'partner_typing_stop',
      callback: (_) {
        _partnerTypingController.add(false);
        _triggerCustomHandler('partner_typing_stop', null);
      },
    );

    _channel!.onBroadcast(
      event: 'partner_joined',
      callback: (payload) {
        _partnerJoinedController.add(Map<String, dynamic>.from(payload));
        _triggerCustomHandler('partner_joined', payload);
      },
    );

    // 2. Presence for online/offline tracking
    _channel!.onPresenceSync((_) {
      final state = _channel!.presenceState();
      bool partnerIsOnline = false;
      for (final presences in state) {
        for (final presence in presences.presences) {
          if (presence.payload['user_id'] != userId) {
            partnerIsOnline = true;
            break;
          }
        }
      }
      _partnerOnlineController.add(partnerIsOnline);
      _triggerCustomHandler(partnerIsOnline ? 'partner_online' : 'partner_offline', null);
    });

    _channel!.subscribe((status, error) {
      if (status == RealtimeSubscribeStatus.subscribed) {
        _isConnected = true;
        debugPrint('[Supabase Realtime] Connected to $channelName');
        // Track self in presence
        _channel!.track({'user_id': userId, 'online_at': DateTime.now().toIso8601String()});
      } else if (status == RealtimeSubscribeStatus.closed || status == RealtimeSubscribeStatus.timedOut) {
        _isConnected = false;
        debugPrint('[Supabase Realtime] Channel disconnected ($status)');
      }
    });
  }

  void _triggerCustomHandler(String event, dynamic data) {
    final handlers = _customHandlers[event];
    if (handlers != null) {
      for (final handler in handlers) {
        handler(data);
      }
    }
  }

  void on(String event, dynamic Function(dynamic) handler) {
    _customHandlers.putIfAbsent(event, () => []).add(handler);
    _channel?.onBroadcast(
      event: event,
      callback: (payload) {
        handler(payload);
      },
    );
  }

  void emit(String event, [dynamic data]) {
    if (event == 'location_update') {
      emitLocationUpdate(Map<String, dynamic>.from(data ?? {}));
    } else if (event == 'send_love_poke') {
      emitLovePoke(Map<String, dynamic>.from(data ?? {}));
    } else if (event == 'new_message') {
      emitNewMessage(Map<String, dynamic>.from(data ?? {}));
    } else {
      _channel?.sendBroadcastMessage(
        event: event,
        payload: data is Map<String, dynamic> ? data : {'data': data},
      );
    }
  }

  void emitNewMessage(Map<String, dynamic> msg) {
    _channel?.sendBroadcastMessage(
      event: 'message_received',
      payload: msg,
    );
  }

  void emitLovePoke(Map<String, dynamic> pokeData) {
    _channel?.sendBroadcastMessage(
      event: 'partner_love_poke',
      payload: pokeData,
    );
  }

  void emitLocationUpdate(Map<String, dynamic> locationData) {
    _channel?.sendBroadcastMessage(
      event: 'partner_location_updated',
      payload: locationData,
    );
  }

  void emitTyping(bool isTyping, String nickname) {
    _channel?.sendBroadcastMessage(
      event: isTyping ? 'partner_typing_start' : 'partner_typing_stop',
      payload: {'nickname': nickname},
    );
  }

  void disconnect() {
    _channel?.unsubscribe();
    _channel = null;
    _isConnected = false;
  }
}
