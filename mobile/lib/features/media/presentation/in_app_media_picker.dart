import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../app/theme/app_colors.dart';
import 'builtin_camera_screen.dart';

class InAppMediaPicker {
  static final ImagePicker _picker = ImagePicker();

  /// Opens full in-app media picker bottom sheet (matching romantic theme)
  static Future<void> show({
    required BuildContext context,
    required Function(File file, String? caption, String type) onMediaSelected,
    VoidCallback? onShareLocation,
  }) async {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1B1822) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.1),
                blurRadius: 24,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top handle
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),

                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.favorite_rounded, color: AppColors.primary, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Kirim Momen Romantis',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                          ),
                        ),
                        Text(
                          'Bagikan foto atau PAP spesial untuk doi',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? Colors.white54 : Colors.black54,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Options Grid (Theme matched)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildOption(
                      icon: Icons.favorite_rounded,
                      label: 'PAP Kilat',
                      badge: 'Instant ❤️',
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF4B72), Color(0xFFFF758C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      onTap: () async {
                        Navigator.pop(ctx);
                        await openPapCamera(
                          context: context,
                          onMediaSelected: onMediaSelected,
                        );
                      },
                    ),
                    _buildOption(
                      icon: Icons.camera_alt_rounded,
                      label: 'Kamera',
                      badge: 'UsOnly 📸',
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF6584), Color(0xFFFF9A8B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      onTap: () async {
                        Navigator.pop(ctx);
                        await openCamera(
                          context: context,
                          onMediaSelected: onMediaSelected,
                        );
                      },
                    ),
                    _buildOption(
                      icon: Icons.photo_library_rounded,
                      label: 'Galeri',
                      badge: 'Editor ✨',
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6C63FF), Color(0xFF9B51E0)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      onTap: () async {
                        Navigator.pop(ctx);
                        await pickFromGallery(
                          context: context,
                          onMediaSelected: onMediaSelected,
                        );
                      },
                    ),
                    if (onShareLocation != null)
                      _buildOption(
                        icon: Icons.location_on_rounded,
                        label: 'Bagi Lokasi',
                        badge: 'Live 📍',
                        gradient: const LinearGradient(
                          colors: [Color(0xFF00B4D8), Color(0xFF0077B6)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        onTap: () {
                          Navigator.pop(ctx);
                          onShareLocation();
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  static Widget _buildOption({
    required IconData icon,
    required String label,
    required String badge,
    required LinearGradient gradient,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 78,
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    gradient: gradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: gradient.colors.first.withValues(alpha: 0.35),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white, size: 26),
                ),
                Positioned(
                  top: -4,
                  right: -6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1B24),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: gradient.colors.first, width: 1),
                    ),
                    child: Text(
                      badge,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Opens built-in camera in PAP mode (front camera default, romantic stickers)
  static Future<void> openPapCamera({
    required BuildContext context,
    required Function(File file, String? caption, String type) onMediaSelected,
  }) async {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BuiltinCameraScreen(
          isPapMode: true,
          onMediaSelected: onMediaSelected,
        ),
      ),
    );
  }

  /// Opens built-in camera in normal photo mode (back camera default)
  static Future<void> openCamera({
    required BuildContext context,
    required Function(File file, String? caption, String type) onMediaSelected,
  }) async {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BuiltinCameraScreen(
          isPapMode: false,
          onMediaSelected: onMediaSelected,
        ),
      ),
    );
  }

  /// Picks from gallery, then opens the in-app romantic photo editor
  static Future<void> pickFromGallery({
    required BuildContext context,
    required Function(File file, String? caption, String type) onMediaSelected,
  }) async {
    try {
      final img = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (img != null && context.mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => BuiltinCameraScreen(
              isPapMode: false,
              initialFile: File(img.path),
              onMediaSelected: onMediaSelected,
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error picking from gallery: $e');
    }
  }

  /// Themed Single Image Picker for Profile / Memories
  static Future<void> pickSingleImage({
    required BuildContext context,
    required Function(File file) onFilePicked,
  }) async {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1B1822) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Pilih Sumber Foto',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 18),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.camera_alt_rounded, color: AppColors.primary),
                  ),
                  title: const Text('Ambil dengan Kamera UsOnly', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Gunakan kamera bawaan aplikasi', style: TextStyle(fontSize: 12)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => BuiltinCameraScreen(
                          isPapMode: false,
                          onMediaSelected: (file, caption, type) {
                            onFilePicked(file);
                          },
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 8),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6C63FF).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.photo_library_rounded, color: Color(0xFF6C63FF)),
                  ),
                  title: const Text('Pilih dari Galeri', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Pilih foto tersimpan dari perangkat', style: TextStyle(fontSize: 12)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    try {
                      final img = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                      if (img != null) {
                        onFilePicked(File(img.path));
                      }
                    } catch (e) {
                      debugPrint('Error picking image: $e');
                    }
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }
}
