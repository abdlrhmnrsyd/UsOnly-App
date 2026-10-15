class MemoryModel {
  final String id;
  final String title;
  final String? description;
  final String? mediaUrl;
  final List<String> photos;
  final DateTime memoryDate;
  final String createdBy;
  final String? senderName;
  final String? senderAvatar;
  final String? locationName;
  final double? latitude;
  final double? longitude;
  final int? batteryLevel;
  final bool isFavorite;
  final DateTime createdAt;

  const MemoryModel({
    required this.id,
    required this.title,
    this.description,
    this.mediaUrl,
    this.photos = const [],
    required this.memoryDate,
    required this.createdBy,
    this.senderName,
    this.senderAvatar,
    this.locationName,
    this.latitude,
    this.longitude,
    this.batteryLevel,
    this.isFavorite = false,
    required this.createdAt,
  });

  factory MemoryModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedPhotos = [];
    if (json['photos'] != null && json['photos'] is List) {
      parsedPhotos = List<String>.from(json['photos']);
    }

    String? singleUrl = json['mediaUrl'] as String? ?? json['photo_url'] as String?;
    if (singleUrl == null && parsedPhotos.isNotEmpty) {
      singleUrl = parsedPhotos.first;
    }

    return MemoryModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Kenangan Kita',
      description: json['story'] as String? ?? json['description'] as String?,
      mediaUrl: singleUrl,
      photos: parsedPhotos,
      memoryDate: json['memory_date'] != null
          ? DateTime.tryParse(json['memory_date'].toString()) ?? DateTime.now()
          : (json['memoryDate'] != null
              ? DateTime.tryParse(json['memoryDate'].toString()) ?? DateTime.now()
              : DateTime.now()),
      createdBy: json['created_by'] as String? ?? json['createdBy'] as String? ?? '',
      senderName: json['sender_name'] as String? ?? json['senderName'] as String?,
      senderAvatar: json['sender_avatar'] as String? ?? json['senderAvatar'] as String?,
      locationName: json['location_name'] as String? ?? json['locationName'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      batteryLevel: (json['battery_level'] as num?)?.toInt() ?? (json['batteryLevel'] as num?)?.toInt(),
      isFavorite: json['is_favorite'] as bool? ?? json['isFavorite'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'story': description,
      'description': description,
      'mediaUrl': mediaUrl,
      'photos': photos.isNotEmpty ? photos : (mediaUrl != null ? [mediaUrl!] : []),
      'memory_date': memoryDate.toIso8601String(),
      'created_by': createdBy,
      'location_name': locationName,
      'latitude': latitude,
      'longitude': longitude,
      'battery_level': batteryLevel,
      'is_favorite': isFavorite,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
