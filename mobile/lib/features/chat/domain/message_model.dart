class MessageModel {
  final String id;
  final String senderUid;
  final String type; // 'text', 'image', 'pap', 'location', 'poke'
  final String? text;
  final String? mediaUrl;
  final String? caption;
  final double? latitude;
  final double? longitude;
  final String? placeLabel;
  final String? reaction;
  final String? replyToId;
  final String? replyToContent;
  final String? replyToSender;
  final DateTime createdAt;
  final List<String> readBy;

  const MessageModel({
    required this.id,
    required this.senderUid,
    required this.type,
    this.text,
    this.mediaUrl,
    this.caption,
    this.latitude,
    this.longitude,
    this.placeLabel,
    this.reaction,
    this.replyToId,
    this.replyToContent,
    this.replyToSender,
    required this.createdAt,
    this.readBy = const [],
  });

  bool isReadBy(String uid) => readBy.contains(uid);

  String get content => text ?? caption ?? '';

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final type = json['message_type']?.toString() ?? json['type']?.toString() ?? 'text';
    final content = json['content']?.toString() ?? json['text']?.toString();
    final isRead = json['is_read'] == true;

    return MessageModel(
      id: json['id']?.toString() ?? '',
      senderUid: json['sender_id']?.toString() ?? json['senderUid']?.toString() ?? '',
      type: type,
      text: content,
      mediaUrl: json['media_url']?.toString() ?? json['mediaUrl']?.toString(),
      caption: json['caption']?.toString() ?? content,
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
      placeLabel: json['place_label']?.toString() ?? json['placeLabel']?.toString(),
      reaction: json['reaction']?.toString(),
      replyToId: json['reply_to']?.toString() ?? json['replyToId']?.toString(),
      replyToContent: json['reply_to_content']?.toString() ?? json['replyToContent']?.toString(),
      replyToSender: json['reply_to_sender']?.toString() ?? json['replyToSender']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : (json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
              : DateTime.now()),
      readBy: isRead ? ['read'] : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sender_id': senderUid,
      'message_type': type,
      'content': text ?? caption,
      'media_url': mediaUrl,
      'latitude': latitude,
      'longitude': longitude,
      'place_label': placeLabel,
      'reaction': reaction,
      'reply_to': replyToId,
      'reply_to_content': replyToContent,
      'reply_to_sender': replyToSender,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
