import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';
import '../../auth/domain/auth_state.dart';
import '../../media/data/storage_repository.dart';
import '../../media/presentation/in_app_media_picker.dart';
import '../../tracking/data/location_repository.dart';
import '../data/memories_repository.dart';

class CreateMemoryScreen extends ConsumerStatefulWidget {
  const CreateMemoryScreen({super.key});

  @override
  ConsumerState<CreateMemoryScreen> createState() => _CreateMemoryScreenState();
}

class _CreateMemoryScreenState extends ConsumerState<CreateMemoryScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _locationController = TextEditingController(text: 'Jakarta');
  DateTime _selectedDate = DateTime.now();
  File? _selectedImage;
  bool _isSaving = false;
  double? _lat;
  double? _lng;

  @override
  void initState() {
    super.initState();
    _fetchDeviceLocation();
  }

  Future<void> _fetchDeviceLocation() async {
    try {
      final pos = await ref.read(locationRepositoryProvider).getCurrentDevicePosition();
      if (pos != null) {
        setState(() {
          _lat = pos.latitude;
          _lng = pos.longitude;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    await InAppMediaPicker.pickSingleImage(
      context: context,
      onFilePicked: (file) {
        setState(() => _selectedImage = file);
      },
    );
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _save() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Judul kenangan tidak boleh kosong.')),
      );
      return;
    }

    final user = ref.read(authStateProvider).user;
    if (user == null || user.coupleId == null) return;

    setState(() => _isSaving = true);
    try {
      String? mediaUrl;
      if (_selectedImage != null) {
        mediaUrl = await ref.read(storageRepositoryProvider).uploadCouplePhoto(
              coupleId: user.coupleId!,
              file: _selectedImage!,
            );
      }

      await ref.read(memoriesRepositoryProvider).createMemory(
            coupleId: user.coupleId!,
            title: title,
            description: _descController.text.trim().isEmpty ? null : _descController.text.trim(),
            mediaUrl: mediaUrl,
            memoryDate: _selectedDate,
            createdBy: user.uid,
            locationName: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
            latitude: _lat,
            longitude: _lng,
            batteryLevel: 88,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kenangan berhasil disimpan! 💕')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menyimpan: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Memory / PAP'),
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Photo picker
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 220,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceSubtleDark : AppColors.surfaceSubtleLight,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.dividerLight),
                ),
                child: _selectedImage != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.file(_selectedImage!, fit: BoxFit.cover),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add_photo_alternate_rounded, size: 48, color: AppColors.primary),
                          const SizedBox(height: 8),
                          Text(
                            'select a special photo / PAP',
                            style: TextStyle(
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 24),
            // Title
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Memory Title / Catatan PAP *',
                hintText: 'e.g. Lagi di kafe nungguin kamu ☕',
              ),
            ),
            const SizedBox(height: 16),
            // Description
            TextField(
              controller: _descController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Cerita Kenangan (opsional)',
                hintText: 'Tuliskan momen indah ini...',
              ),
            ),
            const SizedBox(height: 16),
            // Location Tag
            TextField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: 'Lokasi (opsional)',
                prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 16),
            // Date Picker Card
            ListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: isDark ? AppColors.dividerDark : AppColors.dividerLight),
              ),
              leading: const Icon(Icons.calendar_today_rounded, color: AppColors.primary),
              title: const Text('Tanggal Momen'),
              subtitle: Text(DateFormat('MMMM d, yyyy').format(_selectedDate)),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: _selectDate,
            ),
            const SizedBox(height: 36),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: FilledButton(
                onPressed: _isSaving ? null : _save,
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Simpan Kenangan / Kirim PAP'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
