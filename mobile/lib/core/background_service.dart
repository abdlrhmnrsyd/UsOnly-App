import 'dart:async';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../app/config/supabase_config.dart';
import 'battery_service.dart';

const String foregroundChannelId = 'usonly_foreground';
const String alertChannelId = 'usonly_alerts_v5';
const int notificationId = 888;

// Couple Heartbeat Vibration Pattern (Bump-bump... Bump-bump)
final Int64List romanticVibrationPattern =
    Int64List.fromList([0, 300, 150, 300, 150, 500]);

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

      // Channel 2: Alerts for incoming chat messages & love pokes (Max importance, sound, heartbeat vibration)
      await androidPlugin.createNotificationChannel(
        AndroidNotificationChannel(
          alertChannelId,
          'Pesan & Colekan Pasangan',
          description: 'Notifikasi getar dan suara pesan/colekan dari doi',
          importance: Importance.max,
          enableVibration: true,
          vibrationPattern: romanticVibrationPattern,
          playSound: true,
          showBadge: true,
          enableLights: true,
          ledColor: const Color(0xFFFF4B72),
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
        autoStartOnBoot: true,
        isForegroundMode: true,
        notificationChannelId: foregroundChannelId,
        initialNotificationTitle: 'UsOnly Terhubung ❤️',
        initialNotificationContent: 'Menjaga koneksi lokasi & pesan dengan doi...',
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

    // Ensure service is actively started
    try {
      final isRunning = await service.isRunning();
      if (!isRunning) {
        await service.startService();
      }
    } catch (_) {}
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

  /// Trigger a heads-up alert notification with couple heartbeat vibration
  static Future<void> showAlertNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      alertChannelId,
      'Pesan & Colekan Pasangan',
      channelDescription: 'Notifikasi getar dan suara pesan dari doi',
      importance: Importance.max,
      priority: Priority.max,
      fullScreenIntent: true,
      enableVibration: true,
      vibrationPattern: romanticVibrationPattern,
      playSound: true,
      icon: '@mipmap/ic_launcher',
      color: const Color(0xFFFF4B72),
      enableLights: true,
      ledColor: const Color(0xFFFF4B72),
      subText: 'UsOnly ❤️',
      category: AndroidNotificationCategory.message,
      styleInformation: BigTextStyleInformation(
        body,
        contentTitle: title,
        summaryText: 'UsOnly ❤️',
      ),
    );
    final details = NotificationDetails(android: androidDetails);
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

  // Elevate to Foreground Service on Android immediately so OS never kills process when swiped
  if (service is AndroidServiceInstance) {
    service.setAsForegroundService();
    service.setForegroundNotificationInfo(
      title: "UsOnly Terhubung ❤️",
      content: "Menjaga koneksi lokasi & pesan pasangan",
    );
  }

  final localNotifications = FlutterLocalNotificationsPlugin();
  const androidInitSettings =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const initSettings = InitializationSettings(android: androidInitSettings);
  await localNotifications.initialize(settings: initSettings);

  // Initialize Supabase in background isolate
  try {
    await Supabase.initialize(
      url: SupabaseConfig.url,
      publishableKey: SupabaseConfig.publishableKey,
    );
  } catch (_) {
    // Already initialized or fallback
  }

  final supabase = Supabase.instance.client;
  final prefs = await SharedPreferences.getInstance();

  String currentUserId = prefs.getString('bg_user_id') ?? '';
  String currentSpaceId = prefs.getString('bg_space_id') ?? '';
  String currentPartnerName = prefs.getString('bg_partner_name') ?? 'Doi';

  // Realtime message listener
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

              // Update last checked to avoid duplicate alerts from polling
              final createdAt = record['created_at']?.toString();
              if (createdAt != null) {
                prefs.setString('bg_last_checked_msg', createdAt);
              }
            }
          },
        )
        .subscribe();
  }

  // Listen for context updates from UI isolate
  service.on('updateContext').listen((event) {
    if (event != null) {
      currentUserId = event['userId']?.toString() ?? currentUserId;
      currentSpaceId = event['spaceId']?.toString() ?? currentSpaceId;
      currentPartnerName = event['partnerName']?.toString() ?? currentPartnerName;
      if (currentSpaceId.isNotEmpty) {
        setupRealtimeListener(currentSpaceId);
      }
    }
  });

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  if (currentSpaceId.isNotEmpty) {
    setupRealtimeListener(currentSpaceId);
  }

  // Periodic GPS Location & Message Polling loop every 15 seconds
  Timer.periodic(const Duration(seconds: 15), (timer) async {
    try {
      // Reload prefs to catch changes from UI isolate
      await prefs.reload();
      final freshUserId = prefs.getString('bg_user_id') ?? currentUserId;
      final freshSpaceId = prefs.getString('bg_space_id') ?? currentSpaceId;
      final freshPartnerName = prefs.getString('bg_partner_name') ?? currentPartnerName;

      currentUserId = freshUserId;
      currentPartnerName = freshPartnerName;

      if (freshSpaceId != currentSpaceId && freshSpaceId.isNotEmpty) {
        currentSpaceId = freshSpaceId;
        setupRealtimeListener(currentSpaceId);
      }

      // Self-heal: If user id or space id is missing, read from Supabase auth session
      if (currentUserId.isEmpty) {
        final sessionUser = supabase.auth.currentUser;
        if (sessionUser != null) {
          currentUserId = sessionUser.id;
          await prefs.setString('bg_user_id', currentUserId);
        }
      }

      if (currentSpaceId.isEmpty && currentUserId.isNotEmpty) {
        final profile = await supabase
            .from('profiles')
            .select('space_id')
            .eq('id', currentUserId)
            .maybeSingle();
        final foundSpaceId = profile?['space_id']?.toString() ?? '';
        if (foundSpaceId.isNotEmpty) {
          currentSpaceId = foundSpaceId;
          await prefs.setString('bg_space_id', currentSpaceId);
          setupRealtimeListener(currentSpaceId);
        }
      }

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

      // 1. HTTP Polling for incoming messages (Reliable fallback when closed app drops WebSocket)
      final lastChecked = prefs.getString('bg_last_checked_msg') ??
          DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String();

      try {
        final newMsgs = await supabase
            .from('messages')
            .select('*')
            .eq('couple_id', currentSpaceId)
            .neq('sender_id', currentUserId)
            .gt('created_at', lastChecked)
            .order('created_at', ascending: true);

        if (newMsgs.isNotEmpty) {
          for (final record in newMsgs) {
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

            await AppBackgroundService.showAlertNotification(
              title: title,
              body: body,
            );
          }
          final latestCreatedAt = newMsgs.last['created_at']?.toString() ??
              DateTime.now().toIso8601String();
          await prefs.setString('bg_last_checked_msg', latestCreatedAt);
        }
      } catch (e) {
        debugPrint('[BackgroundService] Check messages notice: $e');
      }

      // 2. Fetch current device GPS position (with fallback to last known)
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 7),
          ),
        );
      } catch (_) {
        try {
          position = await Geolocator.getLastKnownPosition();
        } catch (_) {}
      }

      if (position != null) {
        // 3. Upload location directly to Supabase locations table
        await supabase.from('locations').upsert({
          'couple_id': currentSpaceId,
          'user_id': currentUserId,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'address_label': 'Online 📍',
          'updated_at': DateTime.now().toIso8601String(),
        });

        // 4. Ensure location_sharing is enabled
        await supabase.from('location_sharing').upsert({
          'couple_id': currentSpaceId,
          'user_id': currentUserId,
          'enabled': true,
          'updated_at': DateTime.now().toIso8601String(),
        });
      }

      // 5. Sync real battery level to profile
      final batteryLevel = await BatteryService.getBatteryLevel();
      await supabase.from('profiles').update({
        'battery_level': batteryLevel,
      }).eq('id', currentUserId);

      // 6. Update foreground notification content
      if (service is AndroidServiceInstance) {
        service.setForegroundNotificationInfo(
          title: "UsOnly Terhubung ❤️",
          content: "Berbagi lokasi aktif dengan $currentPartnerName",
        );
      }
    } catch (e) {
      debugPrint('Background location tick notice: $e');
    }
  });
}
