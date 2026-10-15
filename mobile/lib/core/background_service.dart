import 'dart:async';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../app/config/supabase_config.dart';

const String foregroundChannelId = 'usonly_foreground';
const String alertChannelId = 'usonly_alerts';
const int notificationId = 888;

class AppBackgroundService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    final service = FlutterBackgroundService();

    // 1. Initialize Flutter Local Notifications Plugin
    const androidInitSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInitSettings);

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle tapping notification
      },
    );

    // 2. Create Notification Channels for Android
    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    if (androidPlugin != null) {
      // Channel 1: Foreground persistent service (Low importance, silent)
      await androidPlugin.createNotificationChannel(
        const AndroidNotificationChannel(
          foregroundChannelId,
          'Layanan Lokasi UsOnly',
          description: 'Menjaga koneksi lokasi dan pesan saat aplikasi diminimalkan/ditutup',
          importance: Importance.low,
          enableVibration: false,
          playSound: false,
          showBadge: false,
        ),
      );

      // Channel 2: Alerts for incoming chat messages & love pokes (High importance, sound, vibrate)
      await androidPlugin.createNotificationChannel(
        const AndroidNotificationChannel(
          alertChannelId,
          'Pesan & Colekan Pasangan',
          description: 'Notifikasi saat pasangan mengirim pesan baru atau colekan cinta',
          importance: Importance.high,
          enableVibration: true,
          playSound: true,
          showBadge: true,
        ),
      );

      // Request notification permissions on Android 13+
      await androidPlugin.requestNotificationsPermission();
    }

    // 3. Configure Background Service
    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: true,
        isForegroundMode: true,
        notificationChannelId: foregroundChannelId,
        initialNotificationTitle: 'UsOnly Terhubung ❤️',
        initialNotificationContent: 'Menjaga koneksi lokasi dengan pasangan...',
        foregroundServiceNotificationId: notificationId,
        foregroundServiceTypes: [
          AndroidForegroundType.location,
          AndroidForegroundType.dataSync,
        ],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: true,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
  }

  /// Sends updated user context (spaceId, userId, partnerName) to background service
  static Future<void> syncUserContext({
    required String userId,
    required String spaceId,
    required String partnerName,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bg_user_id', userId);
    await prefs.setString('bg_space_id', spaceId);
    await prefs.setString('bg_partner_name', partnerName);

    FlutterBackgroundService().invoke('updateContext', {
      'userId': userId,
      'spaceId': spaceId,
      'partnerName': partnerName,
    });
  }

  /// Trigger a heads-up alert notification manually or from service
  static Future<void> showAlertNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      alertChannelId,
      'Pesan & Colekan Pasangan',
      channelDescription: 'Notifikasi saat pasangan mengirim pesan atau colekan',
      importance: Importance.high,
      priority: Priority.high,
      enableVibration: true,
      playSound: true,
      icon: '@mipmap/ic_launcher',
    );
    const details = NotificationDetails(android: androidDetails);
    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch % 100000,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );
  }
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  return true;
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final localNotifications = FlutterLocalNotificationsPlugin();
  const androidInitSettings =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const initSettings = InitializationSettings(android: androidInitSettings);
  await localNotifications.initialize(settings: initSettings);

  // Initialize Supabase in background isolate
  try {
    await Supabase.initialize(
      url: SupabaseConfig.url,
      anonKey: SupabaseConfig.anonKey,
    );
  } catch (_) {
    // Already initialized or fallback
  }

  final supabase = Supabase.instance.client;
  final prefs = await SharedPreferences.getInstance();

  String currentUserId = prefs.getString('bg_user_id') ?? '';
  String currentSpaceId = prefs.getString('bg_space_id') ?? '';
  String currentPartnerName = prefs.getString('bg_partner_name') ?? 'Doi';

  // Listen for context updates from UI isolate
  service.on('updateContext').listen((event) {
    if (event != null) {
      currentUserId = event['userId']?.toString() ?? currentUserId;
      currentSpaceId = event['spaceId']?.toString() ?? currentSpaceId;
      currentPartnerName = event['partnerName']?.toString() ?? currentPartnerName;
    }
  });

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  // Setup Realtime listener for incoming messages & pokes
  RealtimeChannel? messageChannel;
  void setupRealtimeListener(String spaceId) {
    messageChannel?.unsubscribe();
    if (spaceId.isEmpty) return;

    messageChannel = supabase
        .channel('bg_messages:$spaceId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'couple_id',
            value: spaceId,
          ),
          callback: (payload) {
            final record = payload.newRecord;
            final senderId = record['sender_id']?.toString();

            // Only notify if message is from partner (not self)
            if (senderId != null && senderId != currentUserId) {
              final type = record['message_type']?.toString() ?? 'text';
              String title = '❤️ Pesan dari $currentPartnerName';
              String body = record['content']?.toString() ?? 'Mengirim pesan';

              if (type == 'poke') {
                title = '👉 Colekan Cinta!';
                body = '$currentPartnerName baru saja mencolekmu ❤️';
              } else if (type == 'image') {
                body = '📷 Mengirimkan foto baru';
              } else if (type == 'location') {
                body = '📍 Membagikan lokasi terkini';
              }

              AppBackgroundService.showAlertNotification(
                title: title,
                body: body,
              );
            }
          },
        )
        .subscribe();
  }

  if (currentSpaceId.isNotEmpty) {
    setupRealtimeListener(currentSpaceId);
  }

  // Periodic GPS Location updates & Polling every 25 seconds
  Timer.periodic(const Duration(seconds: 25), (timer) async {
    // Reload prefs in case updated by UI
    final freshUserId = prefs.getString('bg_user_id') ?? currentUserId;
    final freshSpaceId = prefs.getString('bg_space_id') ?? currentSpaceId;
    final freshPartnerName = prefs.getString('bg_partner_name') ?? currentPartnerName;

    if (freshSpaceId != currentSpaceId && freshSpaceId.isNotEmpty) {
      currentSpaceId = freshSpaceId;
      setupRealtimeListener(currentSpaceId);
    }
    currentUserId = freshUserId;
    currentPartnerName = freshPartnerName;

    // Check if user is logged in and paired
    if (currentUserId.isEmpty || currentSpaceId.isEmpty) {
      if (service is AndroidServiceInstance) {
        service.setForegroundNotificationInfo(
          title: "UsOnly Siap Digunakan",
          content: "Silakan buka aplikasi untuk mulai berbagi lokasi",
        );
      }
      return;
    }

    try {
      // 1. Fetch current device GPS position
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );

      // 2. Upload location directly to Supabase locations table
      await supabase.from('locations').upsert({
        'couple_id': currentSpaceId,
        'user_id': currentUserId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'address_label': 'Online 📍',
        'updated_at': DateTime.now().toIso8601String(),
      });

      // 3. Ensure location_sharing is enabled
      await supabase.from('location_sharing').upsert({
        'couple_id': currentSpaceId,
        'user_id': currentUserId,
        'enabled': true,
        'updated_at': DateTime.now().toIso8601String(),
      });

      // 4. Update notification status
      if (service is AndroidServiceInstance) {
        service.setForegroundNotificationInfo(
          title: "UsOnly Terhubung ❤️",
          content: "Lokasi otomatis berbagi dengan $currentPartnerName",
        );
      }
    } catch (e) {
      debugPrint('Background location tick notice: $e');
    }
  });
}
