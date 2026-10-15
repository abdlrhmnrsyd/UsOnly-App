import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';

class BuiltinCameraScreen extends StatefulWidget {
  final bool isPapMode;
  final File? initialFile;
  final Function(File file, String? caption, String type) onMediaSelected;

  const BuiltinCameraScreen({
    super.key,
    required this.isPapMode,
    this.initialFile,
    required this.onMediaSelected,
  });

  @override
  State<BuiltinCameraScreen> createState() => _BuiltinCameraScreenState();
}

class _BuiltinCameraScreenState extends State<BuiltinCameraScreen>
    with WidgetsBindingObserver {
  List<CameraDescription> _cameras = [];
  CameraController? _controller;
  bool _isCameraInitialized = false;
  bool _isLoading = true;
  bool _isTakingPicture = false;
  bool _isFrontCamera = false;
  FlashMode _flashMode = FlashMode.auto;
  File? _capturedFile;
  late bool _isPapMode;
  final TextEditingController _captionController = TextEditingController();
  String _selectedMood = '';

  final List<String> _moods = [
    'Lagi kangen kamu ❤️',
    'Selfie spesial buat kamu 🥰',
    'Lagi santai nih ☕',
    'Lagi kerja/belajar 💻',
    'Lagi di jalan 🚗',
    'Lagi makan 🍕',
    'Mau tidur, mimpi indah 🌙',
    'Mikirin kamu terus ✨',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _isPapMode = widget.isPapMode;
    _isFrontCamera = widget.isPapMode; // PAP Kilat defaults to front camera
    if (widget.isPapMode) {
      _selectedMood = _moods.first;
    }

    if (widget.initialFile != null) {
      _capturedFile = widget.initialFile;
      _isLoading = false;
    } else {
      _setupCameras();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    _captionController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? cameraController = _controller;
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed && _capturedFile == null) {
      _initCamera(_isFrontCamera);
    }
  }

  Future<void> _setupCameras() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        await _initCamera(_isFrontCamera);
      } else {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _isCameraInitialized = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error getting cameras: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isCameraInitialized = false;
        });
      }
    }
  }

  Future<void> _initCamera(bool front) async {
    if (_cameras.isEmpty) return;

    setState(() => _isLoading = true);

    try {
      final selectedCamera = _cameras.firstWhere(
        (c) => c.lensDirection == (front ? CameraLensDirection.front : CameraLensDirection.back),
        orElse: () => _cameras.first,
      );

      final oldController = _controller;
      if (oldController != null) {
        await oldController.dispose();
      }

      final newController = CameraController(
        selectedCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      _controller = newController;
      await newController.initialize();

      try {
        await newController.setFlashMode(_flashMode);
      } catch (_) {}

      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
          _isLoading = false;
          _isFrontCamera = selectedCamera.lensDirection == CameraLensDirection.front;
        });
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      if (mounted) {
        setState(() {
          _isCameraInitialized = false;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _toggleCamera() async {
    if (_cameras.length < 2 || _isLoading) return;
    final nextIsFront = !_isFrontCamera;
    await _initCamera(nextIsFront);
  }

  Future<void> _cycleFlashMode() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    FlashMode next;
    switch (_flashMode) {
      case FlashMode.off:
        next = FlashMode.auto;
        break;
      case FlashMode.auto:
        next = FlashMode.always;
        break;
      default:
        next = FlashMode.off;
        break;
    }
    try {
      await _controller!.setFlashMode(next);
      setState(() => _flashMode = next);
    } catch (_) {
      setState(() => _flashMode = FlashMode.off);
    }
  }

  Future<void> _takePicture() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || _isTakingPicture) {
      return;
    }

    try {
      setState(() => _isTakingPicture = true);
      final XFile picture = await controller.takePicture();
      if (mounted) {
        setState(() {
          _capturedFile = File(picture.path);
          _isTakingPicture = false;
        });
      }
    } catch (e) {
      debugPrint('Error taking picture: $e');
      if (mounted) {
        setState(() => _isTakingPicture = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengambil foto: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final photo = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      if (photo != null && mounted) {
        setState(() {
          _capturedFile = File(photo.path);
        });
      }
    } catch (e) {
      debugPrint('Error picking from gallery: $e');
    }
  }

  void _switchMode(bool papMode) {
    if (_isPapMode == papMode) return;
    setState(() {
      _isPapMode = papMode;
      _selectedMood = papMode ? _moods.first : '';
    });
    // PAP Mode defaults to front camera, normal mode to back camera
    if (papMode && !_isFrontCamera) {
      _toggleCamera();
    } else if (!papMode && _isFrontCamera) {
      _toggleCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_capturedFile != null) {
      return _buildPhotoEditor(_capturedFile!);
    }

    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(alpha: 0.15),
                ),
                child: const Icon(
                  Icons.favorite_rounded,
                  color: AppColors.primary,
                  size: 36,
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Membuka Kamera UsOnly...',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (!_isCameraInitialized || _controller == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1B24),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white12),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.no_photography_rounded,
                      color: AppColors.primary,
                      size: 56,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Kamera Tidak Tersedia',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Pastikan izin kamera telah diizinkan atau pilih foto dari galeri.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: const Icon(Icons.photo_library_rounded),
                      label: const Text('Pilih dari Galeri'),
                      onPressed: _pickFromGallery,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white70,
                        side: const BorderSide(color: Colors.white24),
                        minimumSize: const Size.fromHeight(44),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Batal'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Live Camera Viewfinder
          Positioned.fill(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return ClipRRect(
                  child: FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width: constraints.maxWidth,
                      height: constraints.maxWidth * _controller!.value.aspectRatio,
                      child: CameraPreview(_controller!),
                    ),
                  ),
                );
              },
            ),
          ),

          // Top Gradient Scrim
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 140,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black87, Colors.transparent],
                ),
              ),
            ),
          ),

          // Bottom Gradient Scrim
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 220,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black87, Colors.transparent],
                ),
              ),
            ),
          ),

          // Top Action Bar
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Close Button
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white, size: 28),
                      onPressed: () => Navigator.pop(context),
                    ),

                    // Flash Toggle Button
                    IconButton(
                      icon: Icon(
                        _flashMode == FlashMode.off
                            ? Icons.flash_off_rounded
                            : _flashMode == FlashMode.auto
                                ? Icons.flash_auto_rounded
                                : Icons.flash_on_rounded,
                        color: _flashMode == FlashMode.off ? Colors.white70 : const Color(0xFFFFD166),
                        size: 26,
                      ),
                      onPressed: _cycleFlashMode,
                    ),

                    // App Brand & Mode Indicator Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: _isPapMode
                              ? [const Color(0xFFFF4B72), const Color(0xFFFF758C)]
                              : [const Color(0xFF6C63FF), const Color(0xFF9B51E0)],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: (_isPapMode ? const Color(0xFFFF4B72) : const Color(0xFF6C63FF))
                                .withValues(alpha: 0.4),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _isPapMode ? Icons.favorite_rounded : Icons.camera_alt_rounded,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _isPapMode ? 'PAP KILAT' : 'KAMERA USONLY',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Flip Camera Button
                    if (_cameras.length > 1)
                      IconButton(
                        icon: const Icon(Icons.flip_camera_ios_rounded, color: Colors.white, size: 26),
                        onPressed: _toggleCamera,
                      )
                    else
                      const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
          ),

          // Romantic Watermark Badge on Viewfinder
          Positioned(
            top: 100,
            left: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white24),
              ),
              child: Text(
                'US ONLY • ${DateFormat('HH:mm').format(DateTime.now())}',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          // Bottom Controls Area
          SafeArea(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Mode Switcher Pills
                  Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildModeTab(
                          title: 'Foto Normal 📷',
                          isSelected: !_isPapMode,
                          onTap: () => _switchMode(false),
                        ),
                        const SizedBox(width: 4),
                        _buildModeTab(
                          title: 'PAP Kilat 💖',
                          isSelected: _isPapMode,
                          onTap: () => _switchMode(true),
                        ),
                      ],
                    ),
                  ),

                  // Bottom Action Row (Gallery, Shutter, Flip)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        // Gallery Button
                        GestureDetector(
                          onTap: _pickFromGallery,
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: Colors.white12,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white30, width: 2),
                            ),
                            child: const Icon(
                              Icons.photo_library_rounded,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ),

                        // Shutter Button
                        GestureDetector(
                          onTap: _takePicture,
                          child: Container(
                            width: 82,
                            height: 82,
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 4),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.5),
                                  blurRadius: 18,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: [AppColors.primary, Color(0xFFFF758C)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: Center(
                                child: _isTakingPicture
                                    ? const SizedBox(
                                        width: 28,
                                        height: 28,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 3,
                                        ),
                                      )
                                    : Icon(
                                        _isPapMode
                                            ? Icons.favorite_rounded
                                            : Icons.camera_alt_rounded,
                                        color: Colors.white,
                                        size: 32,
                                      ),
                              ),
                            ),
                          ),
                        ),

                        // Flip Camera Button
                        GestureDetector(
                          onTap: _toggleCamera,
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: Colors.white12,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white30, width: 2),
                            ),
                            child: const Icon(
                              Icons.flip_camera_android_rounded,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModeTab({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white60,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoEditor(File file) {
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
                      // Retake Button
                      IconButton(
                        icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 28),
                        tooltip: 'Foto Ulang',
                        onPressed: () {
                          setState(() {
                            _capturedFile = null;
                            if (!_isCameraInitialized) {
                              _setupCameras();
                            }
                          });
                        },
                      ),

                      // Timestamp & Brand Tag
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.favorite_rounded, color: AppColors.primary, size: 13),
                            const SizedBox(width: 6),
                            Text(
                              'US ONLY • ${DateFormat('HH:mm').format(DateTime.now())}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Mode Indicator Tag
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _isPapMode
                              ? AppColors.primary.withValues(alpha: 0.25)
                              : Colors.white12,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _isPapMode ? 'PAP ❤️' : 'FOTO 📸',
                          style: TextStyle(
                            color: _isPapMode ? AppColors.primary : Colors.white70,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Image Preview Frame
                Expanded(
                  child: Center(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.25),
                            blurRadius: 24,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: Image.file(
                              file,
                              fit: BoxFit.contain,
                            ),
                          ),
                          // Subtle Heart Sticker in bottom corner
                          Positioned(
                            bottom: 12,
                            left: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.favorite, color: AppColors.primary, size: 12),
                                  const SizedBox(width: 4),
                                  Text(
                                    _isPapMode ? 'PAP untuk Doi' : 'UsOnly Moment',
                                    style: const TextStyle(color: Colors.white, fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Mood Tags Scrollable Selector
                Container(
                  height: 44,
                  margin: const EdgeInsets.only(top: 8),
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _moods.length,
                    itemBuilder: (context, index) {
                      final mood = _moods[index];
                      final isSelected = _selectedMood == mood;
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
                              _selectedMood = val ? mood : '';
                            });
                          },
                        ),
                      );
                    },
                  ),
                ),

                // WhatsApp/Romantic Style Composer Bar
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
                            border: Border.all(color: Colors.white12),
                          ),
                          child: TextField(
                            controller: _captionController,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: _isPapMode
                                  ? 'Tulis catatan PAP untuk doi...'
                                  : 'Tambahkan pesan romantis...',
                              hintStyle: const TextStyle(color: Colors.white38),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // Send Button with Gradient
                      GestureDetector(
                        onTap: () {
                          Navigator.pop(context);
                          final customCaption = _captionController.text.trim();
                          final caption = customCaption.isNotEmpty
                              ? customCaption
                              : (_selectedMood.isNotEmpty ? _selectedMood : null);
                          widget.onMediaSelected(
                            file,
                            caption,
                            _isPapMode ? 'pap' : 'image',
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppColors.primary, Color(0xFFFF758C)],
                            ),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary,
                                blurRadius: 10,
                                offset: Offset(0, 2),
                              ),
                            ],
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
