import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/socket_service.dart';
import '../../auth/domain/auth_state.dart';
import '../../media/presentation/app_image_view.dart';
import '../../media/presentation/in_app_media_picker.dart';
import '../data/chat_repository.dart';
import '../domain/message_model.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final List<MessageModel> _messages = [];
  bool _isLoading = true;
  StreamSubscription? _incomingSub;
  MessageModel? _replyingTo;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _listenToIncomingMessages();
  }

  Future<void> _loadMessages() async {
    try {
      final msgs = await ref.read(chatRepositoryProvider).getMessages();
      if (mounted) {
        setState(() {
          _messages.clear();
          _messages.addAll(msgs);
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _listenToIncomingMessages() {
    final user = ref.read(authStateProvider).user;
    final spaceId = user?.coupleId;

    if (spaceId != null && spaceId.isNotEmpty) {
      _incomingSub = ref.read(chatRepositoryProvider).watchMessages(spaceId).listen((msgs) {
        if (mounted) {
          setState(() {
            _messages.clear();
            _messages.addAll(msgs);
            _isLoading = false;
          });
          _scrollToBottom();
        }
      });
    } else {
      _incomingSub = ref.read(chatRepositoryProvider).watchIncomingMessages().listen((msg) {
        if (mounted) {
          setState(() {
            if (!_messages.any((m) => m.id == msg.id)) {
              _messages.add(msg);
            }
          });
          _scrollToBottom();
        }
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _incomingSub?.cancel();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    final reply = _replyingTo;
    _textController.clear();
    setState(() => _replyingTo = null);

    try {
      final auth = ref.read(authStateProvider);
      final partnerName = auth.partner?.nickname.isNotEmpty == true
          ? auth.partner!.nickname
          : (auth.partner?.displayName ?? 'Doi');
      final replySender = reply != null
          ? (reply.senderUid == auth.user?.uid ? 'Kamu' : partnerName)
          : null;

      final msg = await ref.read(chatRepositoryProvider).sendTextMessage(
            text,
            replyToId: reply?.id,
            replyToContent: reply?.content,
            replyToSender: replySender,
          );
      if (mounted) {
        setState(() {
          if (!_messages.any((m) => m.id == msg.id)) {
            _messages.add(msg);
          }
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengirim pesan: $e')),
        );
      }
    }
  }

  Future<void> _handleMediaSelected(File file, String? caption, String type) async {
    final auth = ref.read(authStateProvider);
    final user = auth.user;
    final partner = auth.partner;

    if (user == null || user.coupleId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Belum terhubung dengan pasangan.')),
      );
      return;
    }

    try {
      final reply = _replyingTo;
      setState(() => _replyingTo = null);
      final partnerName = partner?.nickname.isNotEmpty == true
          ? partner!.nickname
          : (partner?.displayName ?? 'Doi');
      final replySender = reply != null
          ? (reply.senderUid == user.uid ? 'Kamu' : partnerName)
          : null;

      final msg = await ref.read(chatRepositoryProvider).sendMediaMessage(
            file: file,
            caption: caption,
            type: type,
            replyToId: reply?.id,
            replyToContent: reply?.content,
            replyToSender: replySender,
          );

      if (mounted) {
        setState(() {
          if (!_messages.any((m) => m.id == msg.id)) {
            _messages.add(msg);
          }
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengirim foto: $e')),
        );
      }
    }
  }

  void _showLovePokeDialog() {
    final auth = ref.read(authStateProvider);
    final myNickname = auth.user?.nickname.isNotEmpty == true
        ? auth.user!.nickname
        : (auth.user?.displayName ?? 'Pasanganmu');

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final pokes = [
          {'type': 'hug', 'label': 'Peluk Jauh Erat', 'icon': '🤗'},
          {'type': 'kiss', 'label': 'Kecup Manis', 'icon': '💋'},
          {'type': 'miss', 'label': 'Kangen Kamu Banget', 'icon': '🥺'},
          {'type': 'tickle', 'label': 'Colek Sayang', 'icon': '👉👈'},
          {'type': 'heartbeat', 'label': 'Detak Jantungku', 'icon': '💓'},
        ];

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          decoration: const BoxDecoration(
            color: AppColors.surfaceDark,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Kirim Colekan Sayang ❤️',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: pokes.map((p) {
                  return InkWell(
                    onTap: () {
                      Navigator.pop(ctx);
                      ref.read(chatRepositoryProvider).sendLovePoke(
                            pokeType: p['type']!,
                            senderNickname: myNickname,
                          );
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Mengirim ${p['label']} ke pasangan! ❤️')),
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(p['icon']!, style: const TextStyle(fontSize: 20)),
                          const SizedBox(width: 8),
                          Text(p['label']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showMessageOptions(MessageModel msg, bool isMe) {
    HapticFeedback.mediumImpact();
    final emojis = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🥰'];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1B24) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Quick Emoji Reactions
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: emojis.map((e) {
                      return InkWell(
                        onTap: () {
                          Navigator.pop(ctx);
                          ref.read(chatRepositoryProvider).reactToMessage(msg.id, e);
                        },
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          child: Text(e, style: const TextStyle(fontSize: 26)),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.reply_rounded, color: AppColors.primary),
                  title: const Text('Balas Pesan', style: TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () {
                    Navigator.pop(ctx);
                    setState(() => _replyingTo = msg);
                  },
                ),
                if (msg.content.isNotEmpty)
                  ListTile(
                    leading: const Icon(Icons.copy_rounded, color: Colors.blueAccent),
                    title: const Text('Salin Teks'),
                    onTap: () {
                      Navigator.pop(ctx);
                      Clipboard.setData(ClipboardData(text: msg.content));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Pesan disalin ke papan klip')),
                      );
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final partner = auth.partner;
    final partnerName = partner?.nickname.isNotEmpty == true
        ? partner!.nickname
        : (partner?.displayName ?? 'Pasangan');
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final myUid = auth.user?.uid ?? '';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        elevation: 0.5,
        title: Row(
          children: [
            AppAvatar(
              photoUrl: partner?.photoUrl,
              name: partnerName,
              radius: 18,
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  partnerName,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                StreamBuilder<bool>(
                  stream: ref.watch(socketServiceProvider).onPartnerOnline,
                  initialData: true,
                  builder: (context, snapshot) {
                    final isOnline = snapshot.data ?? false;
                    return Row(
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: isOnline ? AppColors.success : Colors.grey,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isOnline ? 'Online' : 'Offline',
                          style: TextStyle(
                            fontSize: 10,
                            color: isOnline ? AppColors.success : Colors.grey,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_rounded, color: AppColors.primary),
            tooltip: 'Colekan Cinta',
            onPressed: _showLovePokeDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.favorite_outline_rounded, size: 48, color: AppColors.primary),
                            const SizedBox(height: 12),
                            Text(
                              'Ruang obrolan privat berdua.',
                              style: TextStyle(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Mulai sapalah pasanganmu hari ini ❤️',
                              style: TextStyle(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = msg.senderUid == myUid;
                          final timeStr = DateFormat('HH:mm').format(msg.createdAt);

                          return Dismissible(
                            key: ValueKey('msg_${msg.id}_$index'),
                            direction: DismissDirection.startToEnd,
                            confirmDismiss: (_) async {
                              HapticFeedback.lightImpact();
                              setState(() => _replyingTo = msg);
                              return false;
                            },
                            background: Container(
                              alignment: Alignment.centerLeft,
                              padding: const EdgeInsets.only(left: 16),
                              child: const Icon(Icons.reply_rounded, color: AppColors.primary, size: 26),
                            ),
                            child: GestureDetector(
                              onLongPress: () => _showMessageOptions(msg, isMe),
                              child: (msg.type == 'pap' || msg.type == 'image')
                                  ? _buildPhotoBubble(msg, isMe, isDark, timeStr, partnerName, myUid)
                                  : _buildTextBubble(msg, isMe, isDark, timeStr, partnerName, myUid),
                            ),
                          );
                        },
                      ),
          ),
          _buildReplyBanner(isDark, partnerName, myUid),
          _buildComposer(isDark),
        ],
      ),
    );
  }

  Widget _buildReplyBanner(bool isDark, String partnerName, String myUid) {
    if (_replyingTo == null) return const SizedBox.shrink();
    final isReplyingToMe = _replyingTo!.senderUid == myUid;
    final name = isReplyingToMe ? 'Kamu' : partnerName;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF23202A) : Colors.grey.shade100,
        border: const Border(
          left: BorderSide(color: AppColors.primary, width: 4),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Membalas $name',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _replyingTo!.content.isNotEmpty
                      ? _replyingTo!.content
                      : (_replyingTo!.type == 'image' ? '📸 Foto / PAP' : 'Pesan'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: isDark ? Colors.white70 : Colors.black87,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded, size: 20),
            onPressed: () => setState(() => _replyingTo = null),
          ),
        ],
      ),
    );
  }

  Widget _buildQuotedBox(MessageModel msg, bool isMe, bool isDark, String partnerName, String myUid) {
    if (msg.replyToId == null && msg.replyToContent == null) {
      return const SizedBox.shrink();
    }

    final parent = _messages.cast<MessageModel?>().firstWhere(
      (m) => m?.id == msg.replyToId,
      orElse: () => null,
    );

    final senderName = parent != null
        ? (parent.senderUid == myUid ? 'Kamu' : partnerName)
        : (msg.replyToSender ?? 'Pesan');
    final content = parent?.content.isNotEmpty == true
        ? parent!.content
        : (msg.replyToContent ?? (parent?.type == 'image' ? '📸 Foto' : 'Pesan'));

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: (isMe ? Colors.black26 : (isDark ? Colors.black38 : Colors.grey.shade200)),
        borderRadius: BorderRadius.circular(10),
        border: Border(
          left: BorderSide(
            color: isMe ? Colors.white : AppColors.primary,
            width: 3.5,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            senderName,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isMe ? Colors.white : AppColors.primary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            content,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              color: isMe ? Colors.white70 : (isDark ? Colors.white70 : Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextBubble(MessageModel msg, bool isMe, bool isDark, String timeStr, String partnerName, String myUid) {
    final hasReply = msg.replyToId != null || msg.replyToContent != null;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
            decoration: BoxDecoration(
              color: isMe
                  ? AppColors.primary
                  : (isDark ? AppColors.surfaceSubtleDark : AppColors.surfaceSubtleLight),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(isMe ? 18 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 18),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (hasReply) _buildQuotedBox(msg, isMe, isDark, partnerName, myUid),
                Text(
                  msg.text ?? '',
                  style: TextStyle(
                    color: isMe ? Colors.white : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      timeStr,
                      style: TextStyle(
                        color: isMe ? Colors.white70 : Colors.grey,
                        fontSize: 10,
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 4),
                      Icon(
                        Icons.done_all_rounded,
                        size: 15,
                        color: msg.isReadBy('read') ? const Color(0xFF34B7F1) : Colors.white70,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (msg.reaction != null && msg.reaction!.isNotEmpty)
            Positioned(
              bottom: -6,
              right: isMe ? 4 : null,
              left: isMe ? null : 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2732) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Text(msg.reaction!, style: const TextStyle(fontSize: 12)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPhotoBubble(MessageModel msg, bool isMe, bool isDark, String timeStr, String partnerName, String myUid) {
    final hasReply = msg.replyToId != null || msg.replyToContent != null;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 6),
            width: MediaQuery.of(context).size.width * 0.74,
            decoration: BoxDecoration(
              color: isMe
                  ? AppColors.primaryLight.withValues(alpha: 0.15)
                  : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
            ),
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (hasReply) _buildQuotedBox(msg, isMe, isDark, partnerName, myUid),
                if (msg.mediaUrl != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: AppImageView(
                      imageUrl: msg.mediaUrl!,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                if (msg.text != null && msg.text!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    msg.text!,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerRight,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        timeStr,
                        style: const TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                      if (isMe) ...[
                        const SizedBox(width: 4),
                        Icon(
                          Icons.done_all_rounded,
                          size: 15,
                          color: msg.isReadBy('read') ? const Color(0xFF34B7F1) : Colors.grey,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (msg.reaction != null && msg.reaction!.isNotEmpty)
            Positioned(
              bottom: -4,
              right: isMe ? 4 : null,
              left: isMe ? null : 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2732) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Text(msg.reaction!, style: const TextStyle(fontSize: 12)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildComposer(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.dividerDark : AppColors.dividerLight,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            // PAP Button
            InkWell(
              onTap: () => InAppMediaPicker.openPapCamera(
                context: context,
                onMediaSelected: _handleMediaSelected,
              ),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.camera_alt_rounded, color: AppColors.primary, size: 18),
                    SizedBox(width: 4),
                    Text(
                      'PAP',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.photo_library_rounded, color: AppColors.primary, size: 22),
              tooltip: 'Galeri Foto',
              onPressed: () => InAppMediaPicker.pickFromGallery(
                context: context,
                onMediaSelected: _handleMediaSelected,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary, size: 24),
              tooltip: 'Menu Lainnya',
              onPressed: () => InAppMediaPicker.show(
                context: context,
                onMediaSelected: _handleMediaSelected,
              ),
            ),
            Expanded(
              child: TextField(
                controller: _textController,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  hintText: _replyingTo != null ? 'Ketik balasan...' : 'Ketik pesan...',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 6),
            IconButton(
              icon: const Icon(Icons.send_rounded, color: AppColors.primary),
              onPressed: _sendMessage,
            ),
          ],
        ),
      ),
    );
  }
}
