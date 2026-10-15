import 'package:geolocator/geolocator.dart';

class LocationModel {
  final String uid;
  final String displayName;
  final String? photoUrl;
  final double latitude;
  final double longitude;
  final String? placeLabel;
  final int? batteryLevel;
  final bool isLive;
  final DateTime updatedAt;

  const LocationModel({
    required this.uid,
    required this.displayName,
    this.photoUrl,
    required this.latitude,
    required this.longitude,
    this.placeLabel,
    this.batteryLevel,
    this.isLive = false,
    required this.updatedAt,
  });

  double distanceTo(LocationModel other) {
    if (latitude == 0.0 && longitude == 0.0) return 0.0;
    if (other.latitude == 0.0 && other.longitude == 0.0) return 0.0;
    return Geolocator.distanceBetween(
      latitude,
      longitude,
      other.latitude,
      other.longitude,
    );
  }

  String formattedDistanceTo(LocationModel other) {
    final distMeters = distanceTo(other);
    if (distMeters < 50) {
      return 'Kalian sedang bersama 💕';
    } else if (distMeters < 1000) {
      return '${distMeters.round()} m dari kamu';
    } else {
      return '${(distMeters / 1000).toStringAsFixed(1)} km dari kamu';
    }
  }

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      uid: json['uid'] as String? ?? json['userId'] as String? ?? json['id'] as String? ?? '',
      displayName: json['displayName'] as String? ?? json['senderName'] as String? ?? json['name'] as String? ?? 'User',
      photoUrl: json['photoUrl'] as String? ?? json['avatarUrl'] as String? ?? json['avatar_url'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      placeLabel: json['placeLabel'] as String? ?? json['status_note'] as String? ?? json['place_label'] as String?,
      batteryLevel: (json['batteryLevel'] as num?)?.toInt() ?? (json['battery_level'] as num?)?.toInt(),
      isLive: json['isLive'] as bool? ?? json['is_sharing_enabled'] as bool? ?? json['is_live'] as bool? ?? false,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()
          : (json['updated_at'] != null
              ? DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now()
              : DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'latitude': latitude,
      'longitude': longitude,
      'placeLabel': placeLabel,
      'batteryLevel': batteryLevel,
      'isLive': isLive,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
