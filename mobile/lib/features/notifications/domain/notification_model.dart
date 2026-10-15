class NotificationModel {
  final String id;
  final String coupleId;
  final String senderUid;
  final String senderName;
  final String title;
  final String body;
  final String type; // 'chat', 'pap', 'location', 'miss_you', 'ping', 'poke'
  final DateTime createdAt;
  final bool isRead;

  const NotificationModel({
    required this.id,
    required this.coupleId,
    required this.senderUid,
    required this.senderName,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.isRead = false,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? UniqueKey().toString(),
      coupleId: json['coupleId'] as String? ?? json['space_id'] as String? ?? '',
      senderUid: json['senderUid'] as String? ?? json['sender_id'] as String? ?? '',
      senderName: json['senderName'] as String? ?? json['sender_name'] as String? ?? 'Partner',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? json['message'] as String? ?? '',
      type: json['type'] as String? ?? json['pokeType'] as String? ?? 'chat',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : (json['created_at'] != null
              ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
              : DateTime.now()),
      isRead: json['isRead'] as bool? ?? json['is_read'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'coupleId': coupleId,
      'senderUid': senderUid,
      'senderName': senderName,
      'title': title,
      'body': body,
      'type': type,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
    };
  }
}

class UniqueKey {
  @override
  String toString() => DateTime.now().millisecondsSinceEpoch.toString();
}
