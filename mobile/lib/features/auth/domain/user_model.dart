class UserModel {
  final String uid;
  final String email;
  final String displayName;
  final String nickname;
  final String? photoUrl;
  final String? coupleId;
  final String? bio;
  final String? statusText;
  final int? batteryLevel;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserModel({
    required this.uid,
    required this.email,
    required this.displayName,
    this.nickname = '',
    this.photoUrl,
    this.coupleId,
    this.bio,
    this.statusText,
    this.batteryLevel,
    this.createdAt,
    this.updatedAt,
  });

  bool get isPaired => coupleId != null && coupleId!.isNotEmpty;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      uid: json['id']?.toString() ?? json['uid']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      displayName: json['display_name']?.toString() ?? json['full_name']?.toString() ?? json['displayName']?.toString() ?? 'User',
      nickname: json['nickname']?.toString() ?? '',
      photoUrl: json['avatar_url']?.toString() ?? json['photoUrl']?.toString(),
      coupleId: json['space_id']?.toString() ?? json['coupleId']?.toString(),
      bio: json['bio']?.toString(),
      statusText: json['status_text']?.toString(),
      batteryLevel: json['battery_level'] is int ? json['battery_level'] : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': uid,
      'email': email,
      'full_name': displayName,
      'nickname': nickname,
      'avatar_url': photoUrl,
      'space_id': coupleId,
      'bio': bio,
      'status_text': statusText,
      'battery_level': batteryLevel,
    };
  }

  UserModel copyWith({
    String? displayName,
    String? nickname,
    String? photoUrl,
    String? coupleId,
    String? bio,
    String? statusText,
    int? batteryLevel,
    DateTime? updatedAt,
  }) {
    return UserModel(
      uid: uid,
      email: email,
      displayName: displayName ?? this.displayName,
      nickname: nickname ?? this.nickname,
      photoUrl: photoUrl ?? this.photoUrl,
      coupleId: coupleId ?? this.coupleId,
      bio: bio ?? this.bio,
      statusText: statusText ?? this.statusText,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
