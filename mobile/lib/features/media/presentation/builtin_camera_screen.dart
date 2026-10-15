import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';

class BuiltinCameraScreen extends StatefulWidget {
  final bool isPapMode;
  final Function(File file, String? caption, String type) onMediaSelected;

  const BuiltinCameraScreen({
    super.key,
    required this.isPapMode,
    required this.onMediaSelected,
  });

  @override
  State<BuiltinCameraScreen> createState() => _BuiltinCameraScreenState();
}

class _BuiltinCameraScreenState extends State<BuiltinCameraScreen> {
  File? _capturedFile;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _takePicture();
  }

  Future<void> _takePicture() async {
    try {
      final photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      if (photo != null) {
        setState(() => _capturedFile = File(photo.path));
      } else if (_capturedFile == null) {
        if (mounted) Navigator.pop(context);
      }
    } catch (e) {
      if (mounted && _capturedFile == null) {
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_capturedFile != null) {
      return _buildWhatsAppEditor(_capturedFile!);
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.camera_alt_rounded, color: AppColors.primary, size: 48),
            const SizedBox(height: 16),
            const Text(
              'Membuka Kamera...',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Batal', style: TextStyle(color: Colors.white70)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWhatsAppEditor(File file) {
    final captionController = TextEditingController();
    String selectedMood = widget.isPapMode ? 'Lagi kangen kamu ❤️' : '';

    final moods = [
      'Lagi kangen kamu ❤️',
      'Lagi santai nih ☕',
      'Lagi kerja/belajar 💻',
      'Lagi di jalan 🚗',
      'Lagi makan 🍕',
      'Mau tidur 😴',
    ];

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: StatefulBuilder(
          builder: (context, setEditorState) {
            return Column(
              children: [
                // Top Action Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 28),
                        onPressed: () => Navigator.pop(context),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          'US ONLY • ${DateFormat('HH:mm').format(DateTime.now())}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                ),

                // Image Preview Frame
                Expanded(
                  child: Center(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Image.file(
                        file,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),

                // Bottom Mood Tags (if PAP mode)
                if (widget.isPapMode)
                  Container(
                    height: 44,
                    margin: const EdgeInsets.only(top: 8),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: moods.length,
                      itemBuilder: (context, index) {
                        final mood = moods[index];
                        final isSelected = selectedMood == mood;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(mood),
                            selected: isSelected,
                            selectedColor: AppColors.primary,
                            backgroundColor: Colors.white12,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : Colors.white70,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              fontSize: 11,
                            ),
                            onSelected: (val) {
                              setEditorState(() {
                                selectedMood = val ? mood : '';
                              });
                            },
                          ),
                        );
                      },
                    ),
                  ),

                // WhatsApp-Style Bottom Composer Bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF232128),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: TextField(
                            controller: captionController,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: widget.isPapMode
                                  ? 'Tulis catatan PAP untuk doi...'
                                  : 'Tambahkan keterangan...',
                              hintStyle: const TextStyle(color: Colors.white38),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Floating WhatsApp-Style Send Button
                      GestureDetector(
                        onTap: () {
                          Navigator.pop(context);
                          final caption = captionController.text.trim().isNotEmpty
                              ? captionController.text.trim()
                              : (selectedMood.isNotEmpty ? selectedMood : null);
                          widget.onMediaSelected(
                            file,
                            caption,
                            widget.isPapMode ? 'pap' : 'image',
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.send_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
