import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/background_service.dart';
import '../../../core/socket_service.dart';
import '../domain/location_model.dart';

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return LocationRepository(socketService);
});

class LocationRepository {
  final SocketService _socketService;
  SupabaseClient get _supabase => Supabase.instance.client;

  StreamSubscription<Position>? _positionSubscription;
  Timer? _heartbeatTimer;
  Timer? _pollTimer;
  bool _isLive = true;
  final ValueNotifier<bool> liveSharingNotifier = ValueNotifier<bool>(true);

  final StreamController<Map<String, LocationModel>> _locationsController =
      StreamController<Map<String, LocationModel>>.broadcast();

  final Map<String, LocationModel> _currentLocations = {};

  LocationRepository(this._socketService) {
    // Listen to real-time events for partner location
    _socketService.on('partner_location_updated', (data) {
      if (data is Map<String, dynamic>) {
        final loc = LocationModel.fromJson(data);
        if (loc.uid.isNotEmpty) {
          _currentLocations[loc.uid] = loc;
          _locationsController.add(Map.unmodifiable(_currentLocations));
        }
      }
    });
  }

  bool get isLiveSharing => _isLive;

  Stream<Map<String, LocationModel>> watchCoupleLocations(String coupleId) {
    _fetchLocations(coupleId);

    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) => _fetchLocations(coupleId));

    return _locationsController.stream;
  }

  Future<void> _fetchLocations([String? spaceId]) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      String actualSpaceId = spaceId ?? '';
      if (actualSpaceId.isEmpty) {
        final profile = await _supabase
            .from('profiles')
            .select('space_id')
            .eq('id', user.id)
            .maybeSingle();
        actualSpaceId = profile?['space_id']?.toString() ?? '';
      }

      if (actualSpaceId.isEmpty) return;

      final rows = await _supabase
          .from('locations')
          .select('*, profiles(display_name, nickname, avatar_url)')
          .eq('couple_id', actualSpaceId);

      for (final r in rows) {
        final uid = r['user_id']?.toString() ?? '';
        if (uid.isNotEmpty) {
          final profileData = r['profiles'] as Map<String, dynamic>?;
          final name = profileData?['nickname'] ?? profileData?['display_name'] ?? 'Partner';
          final avatar = profileData?['avatar_url'];

          final loc = LocationModel(
            uid: uid,
            displayName: name,
            photoUrl: avatar,
            latitude: (r['latitude'] as num).toDouble(),
            longitude: (r['longitude'] as num).toDouble(),
            placeLabel: r['address_label']?.toString() ?? r['status_note']?.toString() ?? 'Di Lokasi 📍',
            batteryLevel: 88,
            isLive: true,
            updatedAt: r['updated_at'] != null
                ? DateTime.tryParse(r['updated_at'].toString()) ?? DateTime.now()
                : DateTime.now(),
          );
          _currentLocations[uid] = loc;
        }
      }
      _locationsController.add(Map.unmodifiable(_currentLocations));
    } catch (e) {
      debugPrint('Error fetching locations from Supabase: $e');
    }
  }

  Future<Position?> getCurrentDevicePosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Location service may be disabled
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 4),
        ),
      );
    } catch (e) {
      debugPrint('Geolocator notice: $e');
      try {
        return await Geolocator.getLastKnownPosition();
      } catch (_) {
        return null;
      }
    }
  }

  /// Turn ON Live Location sharing.
  Future<void> startLiveSharing({
    required String coupleId,
    required String uid,
    required String displayName,
    String? photoUrl,
    String? placeLabel,
  }) async {
    _isLive = true;
    liveSharingNotifier.value = true;

    try {
      await _supabase.from('location_sharing').upsert({
        'couple_id': coupleId,
        'user_id': uid,
        'enabled': true,
        'updated_at': DateTime.now().toIso8601String(),
      });
    } catch (_) {}

    // Sync user context to persistent background service
    try {
      await AppBackgroundService.syncUserContext(
        userId: uid,
        spaceId: coupleId,
        partnerName: displayName,
      );
    } catch (_) {}

    // Push initial location
    try {
      await updateLocation(
        coupleId: coupleId,
        uid: uid,
        displayName: displayName,
        photoUrl: photoUrl,
        placeLabel: placeLabel,
        isLive: true,
      );
    } catch (e) {
      debugPrint('Initial live coordinate notice: $e');
    }

    await _positionSubscription?.cancel();
    _heartbeatTimer?.cancel();

    // Listen to real-time GPS stream with Android Foreground service support
    try {
      LocationSettings locationSettings;
      if (defaultTargetPlatform == TargetPlatform.android) {
        locationSettings = AndroidSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
          intervalDuration: const Duration(seconds: 15),
          foregroundNotificationConfig: const ForegroundNotificationConfig(
            notificationTitle: "UsOnly - Berbagi Lokasi ❤️",
            notificationText: "Lokasi otomatis aktif berbagi bersama pasangan",
            enableWakeLock: true,
          ),
        );
      } else {
        locationSettings = const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        );
      }

      _positionSubscription = Geolocator.getPositionStream(
        locationSettings: locationSettings,
      ).listen((pos) {
        if (_isLive) {
          updateLocation(
            coupleId: coupleId,
            uid: uid,
            displayName: displayName,
            photoUrl: photoUrl,
            placeLabel: placeLabel,
            manualLat: pos.latitude,
            manualLng: pos.longitude,
            isLive: true,
          );
        }
      }, onError: (err) {
        debugPrint('Geolocator stream notice: $err');
      });
    } catch (e) {
      debugPrint('Could not start GPS stream: $e');
    }

    // Periodic heartbeat every 10 seconds
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      if (_isLive) {
        final pos = await getCurrentDevicePosition();
        if (_isLive) {
          updateLocation(
            coupleId: coupleId,
            uid: uid,
            displayName: displayName,
            photoUrl: photoUrl,
            placeLabel: placeLabel,
            manualLat: pos?.latitude,
            manualLng: pos?.longitude,
            isLive: true,
          );
        }
      }
    });
  }

  /// Turn OFF Live Location sharing.
  Future<void> stopLiveSharing({
    required String coupleId,
    required String uid,
  }) async {
    _isLive = false;
    liveSharingNotifier.value = false;
    await _positionSubscription?.cancel();
    _heartbeatTimer?.cancel();
    _positionSubscription = null;
    _heartbeatTimer = null;

    try {
      await _supabase.from('location_sharing').upsert({
        'couple_id': coupleId,
        'user_id': uid,
        'enabled': false,
        'updated_at': DateTime.now().toIso8601String(),
      });
      // Broadcast via socket
      _socketService.emit('location_update', {
        'uid': uid,
        'isLive': false,
        'updated_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('Stop live sharing notice: $e');
    }
  }

  Future<LocationModel?> updateLocation({
    required String coupleId,
    required String uid,
    required String displayName,
    String? photoUrl,
    String? placeLabel,
    double? manualLat,
    double? manualLng,
    bool isLive = false,
  }) async {
    double lat = manualLat ?? 0.0;
    double lng = manualLng ?? 0.0;

    if (manualLat == null || manualLng == null) {
      final pos = await getCurrentDevicePosition();
      if (pos != null) {
        lat = pos.latitude;
        lng = pos.longitude;
      } else {
        lat = -6.2088; // Default Jakarta
        lng = 106.8456;
      }
    }

    final model = LocationModel(
      uid: uid,
      displayName: displayName,
      photoUrl: photoUrl,
      latitude: lat,
      longitude: lng,
      placeLabel: placeLabel ?? 'Di Rumah 🏡',
      batteryLevel: 88,
      isLive: isLive,
      updatedAt: DateTime.now(),
    );

    _currentLocations[uid] = model;
    _locationsController.add(Map.unmodifiable(_currentLocations));

    // Upsert in Supabase
    try {
      await _supabase.from('locations').upsert({
        'couple_id': coupleId,
        'user_id': uid,
        'latitude': lat,
        'longitude': lng,
        'status_note': placeLabel ?? 'Di Rumah 🏡',
        'address_label': placeLabel ?? 'Di Rumah 🏡',
        'updated_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('Supabase upsert location notice: $e');
    }

    // Broadcast in real-time
    try {
      _socketService.emit('location_update', model.toJson());
    } catch (e) {
      debugPrint('Socket emit location notice: $e');
    }

    return model;
  }
}
