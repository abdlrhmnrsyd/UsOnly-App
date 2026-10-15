import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/theme/app_colors.dart';
import '../../auth/domain/auth_state.dart';
import '../../media/data/storage_repository.dart';
import '../../media/presentation/app_image_view.dart';
import '../../media/presentation/in_app_media_picker.dart';
import '../../updater/data/app_update_service.dart';
import '../../updater/presentation/update_dialog.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _changePhoto(BuildContext context, WidgetRef ref, String uid) async {
    await InAppMediaPicker.pickSingleImage(
      context: context,
      onFilePicked: (file) async {
        try {
          final url = await ref.read(storageRepositoryProvider).uploadProfilePhoto(
                uid: uid,
                file: file,
              );
          await ref.read(authRepositoryProvider).updateProfile(photoUrl: url);
          await ref.read(authStateProvider.notifier).checkAuthStatus();
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Gagal mengganti foto: $e'), backgroundColor: AppColors.error),
            );
          }
        }
      },
    );
  }

  void _editDisplayName(BuildContext context, WidgetRef ref, String currentName) {
    final controller = TextEditingController(text: currentName);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Display Name'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Display Name'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          FilledButton(
            onPressed: () async {
              final newName = controller.text.trim();
              if (newName.isNotEmpty) {
                await ref.read(authRepositoryProvider).updateProfile(displayName: newName);
                await ref.read(authStateProvider.notifier).checkAuthStatus();
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteAccount(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Akun?'),
        content: const Text(
          'Ini akan menghapus identitas akun kamu secara permanen. Tindakan ini tidak dapat dibatalkan.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authStateProvider.notifier).deleteAccount();
            },
            child: const Text('Hapus Permanen'),
          ),
        ],
      ),
    );
  }

  Future<void> _checkForUpdate(BuildContext context) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Memeriksa pembaruan aplikasi...')),
    );
    try {
      final update = await AppUpdateService.checkForUpdate();
      if (context.mounted) {
        if (update != null) {
          UpdateDialog.show(context, update);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Aplikasi kamu sudah versi terbaru! ✨'),
              backgroundColor: AppColors.primary,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memeriksa pembaruan: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil & Pengaturan'),
        backgroundColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          // Profile Card
          Center(
            child: Stack(
              children: [
                AppAvatar(
                  photoUrl: user.photoUrl,
                  name: user.displayName,
                  radius: 52,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.primary,
                    child: IconButton(
                      icon: const Icon(Icons.camera_alt_rounded, size: 18, color: Colors.white),
                      onPressed: () => _changePhoto(context, ref, user.uid),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              user.displayName,
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          Center(
            child: Text(
              user.email,
              style: TextStyle(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
            ),
          ),
          const SizedBox(height: 32),
          // Options List
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.edit_rounded, color: AppColors.primary),
                  title: const Text('Edit Nama Panggilan'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => _editDisplayName(context, ref, user.displayName),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.security_rounded, color: AppColors.primary),
                  title: const Text('Privasi & Keamanan'),
                  subtitle: const Text('Enkripsi dan akses eksklusif hanya untuk berdua'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.system_update_rounded, color: AppColors.primary),
                  title: const Text('Pembaruan Aplikasi'),
                  subtitle: const Text('Periksa dan update versi terbaru'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => _checkForUpdate(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Destructive / Session actions
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: AppColors.textSecondaryLight),
                  title: const Text('Keluar dari Akun'),
                  onTap: () => ref.read(authStateProvider.notifier).logout(),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.delete_forever_rounded, color: AppColors.error),
                  title: const Text('Hapus Akun', style: TextStyle(color: AppColors.error)),
                  onTap: () => _confirmDeleteAccount(context, ref),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
