import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/api_client.dart';
import '../../../core/socket_service.dart';
import '../domain/location_model.dart';

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final socketService = ref.watch(socketServiceProvider);
  return LocationRepository(apiClient, socketService);
});

class LocationRepository {
  final ApiClient _apiClient;
  final SocketService _socketService;
  StreamSubscription<Position>? _positionSubscription;
  Timer? _heartbeatTimer;
  Timer? _pollTimer;
  bool _isLive = false;
  final ValueNotifier<bool> liveSharingNotifier = ValueNotifier<bool>(false);

  final StreamController<Map<String, LocationModel>> _locationsController =
      StreamController<Map<String, LocationModel>>.broadcast();

  final Map<String, LocationModel> _currentLocations = {};

  LocationRepository(this._apiClient, this._socketService) {
    // Listen to real-time socket events for partner location
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
    // Initial fetch from backend
    _fetchLocations();

    // Start periodic background polling as backup to socket
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) => _fetchLocations());

    return _locationsController.stream;
  }

  Future<void> _fetchLocations() async {
    try {
      final res = await _apiClient.get('/location');
      if (res['success'] == true) {
        if (res['my_location'] != null) {
          final myLoc = LocationModel.fromJson(Map<String, dynamic>.from(res['my_location']));
          if (myLoc.uid.isNotEmpty) {
            _currentLocations[myLoc.uid] = myLoc;
          }
        }
        if (res['partner_location'] != null) {
          final partnerLoc = LocationModel.fromJson(Map<String, dynamic>.from(res['partner_location']));
          if (partnerLoc.uid.isNotEmpty) {
            _currentLocations[partnerLoc.uid] = partnerLoc;
          }
        }
        _locationsController.add(Map.unmodifiable(_currentLocations));
      }
    } catch (e) {
      debugPrint('Error fetching locations: $e');
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
      await _apiClient.post('/location/toggle-consent', {
        'is_sharing_enabled': true,
      });
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

    // Listen to real-time GPS stream
    try {
      _positionSubscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        ),
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
      await _apiClient.post('/location/toggle-consent', {
        'is_sharing_enabled': false,
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

    // Send to backend REST API
    try {
      await _apiClient.post('/location/update', {
        'latitude': lat,
        'longitude': lng,
        'status_note': placeLabel ?? 'Di Rumah 🏡',
        'battery_level': 88,
      });
    } catch (e) {
      debugPrint('REST update location notice: $e');
    }

    // Broadcast in real-time via Socket.IO
    try {
      _socketService.emit('location_update', model.toJson());
    } catch (e) {
      debugPrint('Socket emit location notice: $e');
    }

    return model;
  }
}
