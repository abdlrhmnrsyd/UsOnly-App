import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/background_service.dart';
import '../../../core/socket_service.dart';
import '../domain/notification_model.dart';

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return NotificationsRepository(socketService);
});

class NotificationsRepository {
  final SocketService _socketService;
  final List<NotificationModel> _notifications = [];
  final StreamController<List<NotificationModel>> _streamController =
      StreamController<List<NotificationModel>>.broadcast();

  NotificationsRepository(this._socketService) {
    // Listen to real-time poke events from partner
    _socketService.on('partner_love_poke', (data) {
      if (data is Map<String, dynamic>) {
        final notif = NotificationModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          coupleId: '',
          senderUid: data['senderId'] as String? ?? '',
          senderName: data['senderNickname'] as String? ?? 'Doi',
          title: '${data['icon'] ?? '❤️'} Colekan dari ${data['senderNickname'] ?? 'Doi'}',
          body: data['pokeTitle'] as String? ?? data['customNote'] as String? ?? 'Mengirimkan sinyal cinta!',
          type: 'miss_you',
          createdAt: DateTime.now(),
          isRead: false,
        );
        _notifications.insert(0, notif);
        _streamController.add(List.unmodifiable(_notifications));

        AppBackgroundService.showAlertNotification(
          title: notif.title,
          body: notif.body,
        );
      }
    });

    // Listen to chat message notifications
    _socketService.on('message_received', (data) {
      if (data is Map<String, dynamic>) {
        final notif = NotificationModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          coupleId: '',
          senderUid: data['sender_id'] as String? ?? '',
          senderName: 'Doi',
          title: '💬 Pesan Baru',
          body: data['content'] as String? ?? 'Mengirim pesan baru',
          type: data['message_type'] as String? ?? 'chat',
          createdAt: DateTime.now(),
          isRead: false,
        );
        _notifications.insert(0, notif);
        _streamController.add(List.unmodifiable(_notifications));

        AppBackgroundService.showAlertNotification(
          title: notif.title,
          body: notif.body,
        );
      }
    });
  }

  Stream<List<NotificationModel>> watchNotifications(String coupleId) {
    _streamController.add(List.unmodifiable(_notifications));
    return _streamController.stream;
  }

  Future<void> sendNotification({
    required String coupleId,
    required String senderUid,
    required String senderName,
    required String title,
    required String body,
    required String type,
  }) async {
    final notif = NotificationModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      coupleId: coupleId,
      senderUid: senderUid,
      senderName: senderName,
      title: title,
      body: body,
      type: type,
      createdAt: DateTime.now(),
      isRead: false,
    );

    _notifications.insert(0, notif);
    _streamController.add(List.unmodifiable(_notifications));

    // Emit via socket if relevant
    if (type == 'miss_you' || type == 'poke') {
      _socketService.emit('send_love_poke', {
        'pokeType': type,
        'senderNickname': senderName,
        'customNote': body,
      });
    }
  }

  Future<void> markAsRead(String coupleId, String notifId) async {
    final idx = _notifications.indexWhere((n) => n.id == notifId);
    if (idx != -1) {
      final old = _notifications[idx];
      _notifications[idx] = NotificationModel(
        id: old.id,
        coupleId: old.coupleId,
        senderUid: old.senderUid,
        senderName: old.senderName,
        title: old.title,
        body: old.body,
        type: old.type,
        createdAt: old.createdAt,
        isRead: true,
      );
      _streamController.add(List.unmodifiable(_notifications));
    }
  }

  Future<void> markAllAsRead(String coupleId, String recipientUid) async {
    for (int i = 0; i < _notifications.length; i++) {
      final old = _notifications[i];
      _notifications[i] = NotificationModel(
        id: old.id,
        coupleId: old.coupleId,
        senderUid: old.senderUid,
        senderName: old.senderName,
        title: old.title,
        body: old.body,
        type: old.type,
        createdAt: old.createdAt,
        isRead: true,
      );
    }
    _streamController.add(List.unmodifiable(_notifications));
  }
}
