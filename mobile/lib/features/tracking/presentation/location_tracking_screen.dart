import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/battery_service.dart';
import '../../auth/domain/auth_state.dart';
import '../../chat/data/chat_repository.dart';
import '../../media/presentation/app_image_view.dart';
import '../data/location_repository.dart';
import '../domain/location_model.dart';

enum MapStyleType {
  openStreetMap,
  cartoVoyager,
  cartoDark,
  googleRoadmap,
  googleSatellite,
  googleTerrain,
}

class LocationTrackingScreen extends ConsumerStatefulWidget {
  const LocationTrackingScreen({super.key});

  @override
  ConsumerState<LocationTrackingScreen> createState() => _LocationTrackingScreenState();
}

class _LocationTrackingScreenState extends ConsumerState<LocationTrackingScreen>
    with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  MapStyleType _selectedMapStyle = MapStyleType.openStreetMap;
  bool _isPanelExpanded = true;
  String _selectedStatus = 'Di Rumah 🏡';
  LatLng? _lastAutoCenteredPoint;
  int _myBatteryLevel = 100;

  final List<String> _statusOptions = [
    'Di Rumah 🏡',
    'Lagi OTW 🛵',
    'Di Kampus 📚',
    'Di Kantor 💼',
    'Nongkrong ☕',
    'Kangen Kamu 💕',
  ];

  @override
  void initState() {
    super.initState();
    _loadBattery();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
    _pulseAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOutQuad),
    );

    // Initial location push
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initUserLocation();
    });
  }

  Future<void> _loadBattery() async {
    try {
      final level = await BatteryService.getBatteryLevel();
      if (mounted) setState(() => _myBatteryLevel = level);
    } catch (_) {}
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _initUserLocation() async {
    final user = ref.read(authStateProvider).user;
    if (user != null && user.coupleId != null) {
      await ref.read(locationRepositoryProvider).updateLocation(
            coupleId: user.coupleId!,
            uid: user.uid,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            placeLabel: _selectedStatus,
          );
    }
  }

  String _getTileUrl(MapStyleType style) {
    switch (style) {
      case MapStyleType.openStreetMap:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      case MapStyleType.cartoVoyager:
        return 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';
      case MapStyleType.cartoDark:
        return 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png';
      case MapStyleType.googleRoadmap:
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      case MapStyleType.googleSatellite:
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      case MapStyleType.googleTerrain:
        return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
    }
  }

  Future<void> _toggleLiveSharing(bool enable) async {
    final user = ref.read(authStateProvider).user;
    if (user == null || user.coupleId == null) return;

    final repo = ref.read(locationRepositoryProvider);
    try {
      if (enable) {
        await repo.startLiveSharing(
          coupleId: user.coupleId!,
          uid: user.uid,
          displayName: user.displayName,
          photoUrl: user.photoUrl,
          placeLabel: _selectedStatus,
        );

        // Check if Android has granted "Allow all the time"
        final perm = await Geolocator.checkPermission();
        if (perm != LocationPermission.always && mounted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Row(
                children: [
                  Icon(Icons.location_on_rounded, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text('Lokasi Saat Ditutup', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
              content: const Text(
                'Agar doi tetap bisa melacak lokasimu saat aplikasi ditutup atau dihapus dari recent apps, pilih "Izinkan sepanjang waktu" (Allow all the time) di setelan izin lokasi.',
                style: TextStyle(fontSize: 13),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Nanti Saja'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    Geolocator.openAppSettings();
                  },
                  child: const Text('Buka Pengaturan ⚙️'),
                ),
              ],
            ),
          );
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🟢 Live Location Aktif! Berbagi realtime dengan doi.'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        await repo.stopLiveSharing(
          coupleId: user.coupleId!,
          uid: user.uid,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('⚪ Live Location Dimatikan.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error toggling live location: $e');
    }
    if (mounted) setState(() {});
  }

  Future<void> _openNavigation(double lat, double lng) async {
    final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(uri);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tidak dapat membuka Google Maps: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _shareToChat(LocationModel myLoc) async {
    final user = ref.read(authStateProvider).user;
    if (user == null || user.coupleId == null) return;

    try {
      final convId = 'conv_${user.coupleId}';
      await ref.read(chatRepositoryProvider).sendMessage(
            conversationId: convId,
            senderUid: user.uid,
            senderName: user.displayName,
            senderAvatar: user.photoUrl,
            content: '📍 Lokasiku sekarang: ${myLoc.placeLabel ?? _selectedStatus}',
            type: 'location',
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lokasi dibagikan ke Chat! 💬'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.go('/chat');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengirim ke chat: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _centerOnLocation(LatLng point, {double zoom = 16.0}) {
    try {
      _mapController.move(point, zoom);
    } catch (e) {
      debugPrint('Map move error: $e');
    }
  }

  void _fitBothLocations(LatLng p1, LatLng p2) {
    try {
      final bounds = LatLngBounds.fromPoints([p1, p2]);
      _mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.only(left: 60, right: 60, top: 120, bottom: 280),
          maxZoom: 16.5,
        ),
      );
    } catch (_) {
      _centerOnLocation(p1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).user;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (user == null || user.coupleId == null) {
      return const Scaffold(
        body: Center(child: Text('Silakan hubungkan pasangan terlebih dahulu.')),
      );
    }

    final coupleId = user.coupleId!;
    final repo = ref.watch(locationRepositoryProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: StreamBuilder<Map<String, LocationModel>>(
        stream: repo.watchCoupleLocations(coupleId),
        builder: (context, snapshot) {
          final locs = snapshot.data ?? {};
          final myLoc = locs[user.uid];
          final partnerEntry = locs.entries.where((e) => e.key != user.uid);
          final partnerLoc = partnerEntry.isNotEmpty ? partnerEntry.first.value : null;

          final isMyLiveActive = (myLoc?.isLive == true) || repo.isLiveSharing;
          final isPartnerLive = partnerLoc?.isLive ?? false;

          final myLatLng = (myLoc != null && myLoc.latitude != 0.0 && myLoc.longitude != 0.0)
              ? LatLng(myLoc.latitude, myLoc.longitude)
              : const LatLng(-6.2088, 106.8456);

          final partnerLatLng = (partnerLoc != null && partnerLoc.latitude != 0.0 && partnerLoc.longitude != 0.0)
              ? LatLng(partnerLoc.latitude, partnerLoc.longitude)
              : LatLng(myLatLng.latitude + 0.0055, myLatLng.longitude + 0.0072);

          final partnerDisplayName = partnerLoc?.displayName ?? 'Pasangan Kamu';
          final partnerPhotoUrl = partnerLoc?.photoUrl;
          final partnerBattery = partnerLoc?.batteryLevel ?? 100;
          final partnerPlace = partnerLoc?.placeLabel ?? 'Di Rumah 🏡';

          final distanceMeters = const Distance().as(LengthUnit.Meter, myLatLng, partnerLatLng);
          final String distanceString = distanceMeters < 50
              ? 'Kalian sedang bersama 💕'
              : distanceMeters < 1000
                  ? '${distanceMeters.round()} m dari kamu'
                  : '${(distanceMeters / 1000).toStringAsFixed(1)} km dari kamu';
          final int carMinutes = (distanceMeters / 450).ceil().clamp(1, 999);
          final int walkMinutes = (distanceMeters / 75).ceil().clamp(1, 999);

          if (_lastAutoCenteredPoint == null ||
              (_lastAutoCenteredPoint!.latitude - myLatLng.latitude).abs() > 0.005 ||
              (_lastAutoCenteredPoint!.longitude - myLatLng.longitude).abs() > 0.005) {
            _lastAutoCenteredPoint = myLatLng;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _fitBothLocations(myLatLng, partnerLatLng);
            });
          }

          final midPoint = LatLng(
            (myLatLng.latitude + partnerLatLng.latitude) / 2,
            (myLatLng.longitude + partnerLatLng.longitude) / 2,
          );

          return Stack(
            children: [
              // 0. MAP VECTOR CANVAS
              Positioned.fill(
                child: CustomPaint(
                  painter: GoogleMapsCanvasPainter(isDark: isDark),
                ),
              ),

              // 1. FULLSCREEN INTERACTIVE MAP
              Positioned.fill(
                child: FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: myLatLng,
                    initialZoom: 15.0,
                    minZoom: 3.0,
                    maxZoom: 19.0,
                    backgroundColor: Colors.transparent,
                    interactionOptions: const InteractionOptions(
                      flags: InteractiveFlag.all,
                    ),
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: _getTileUrl(_selectedMapStyle),
                      userAgentPackageName: 'com.ourspace.usonly',
                      maxZoom: 19,
                    ),

                    // Connection Polyline
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: [myLatLng, partnerLatLng],
                          color: AppColors.primary.withValues(alpha: 0.75),
                          strokeWidth: 3.0,
                          pattern: StrokePattern.dashed(segments: const [8, 6]),
                        ),
                      ],
                    ),

                    // Distance midpoint badge
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: midPoint,
                          width: 130,
                          height: 32,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.4),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                distanceString,
                                maxLines: 1,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),

                        // Partner Marker
                        Marker(
                          point: partnerLatLng,
                          width: 80,
                          height: 95,
                          alignment: Alignment.topCenter,
                          child: AnimatedBuilder(
                            animation: _pulseAnimation,
                            builder: (context, _) => _buildPinMarker(
                              name: partnerDisplayName,
                              photoUrl: partnerPhotoUrl,
                              isMe: false,
                              isLive: isPartnerLive,
                              batteryLevel: partnerBattery,
                              pulseValue: _pulseAnimation.value,
                            ),
                          ),
                        ),

                        // My Marker
                        Marker(
                          point: myLatLng,
                          width: 80,
                          height: 95,
                          alignment: Alignment.topCenter,
                          child: AnimatedBuilder(
                            animation: _pulseAnimation,
                            builder: (context, _) => _buildPinMarker(
                              name: 'Kamu',
                              photoUrl: user.photoUrl,
                              isMe: true,
                              isLive: isMyLiveActive,
                              batteryLevel: _myBatteryLevel,
                              pulseValue: _pulseAnimation.value,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 2. TOP BAR OVERLAY
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 48,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              color: (isDark ? AppColors.surfaceDark : Colors.white).withValues(alpha: 0.95),
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.12),
                                  blurRadius: 12,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isMyLiveActive ? AppColors.success : Colors.grey,
                                    boxShadow: isMyLiveActive
                                        ? [
                                            BoxShadow(
                                              color: AppColors.success.withValues(alpha: 0.6),
                                              blurRadius: 6,
                                              spreadRadius: 2,
                                            )
                                          ]
                                        : null,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Find Hub • Live Tracking',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                                        ),
                                      ),
                                      Text(
                                        isMyLiveActive
                                            ? '🟢 Live streaming aktif'
                                            : '⚪ Berbagi lokasi standby',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isMyLiveActive ? AppColors.success : Colors.grey,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Map Style Layer Switcher Popup
                        PopupMenuButton<MapStyleType>(
                          tooltip: 'Pilih Gaya Peta',
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          icon: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: (isDark ? AppColors.surfaceDark : Colors.white).withValues(alpha: 0.9),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.12),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.layers_rounded, size: 20),
                          ),
                          onSelected: (style) {
                            setState(() => _selectedMapStyle = style);
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: MapStyleType.openStreetMap,
                              child: Row(
                                children: [
                                  Icon(Icons.public_rounded, size: 18, color: Color(0xFF2EC4B6)),
                                  SizedBox(width: 10),
                                  Text('OpenStreetMap (Clean / Tanpa Watermark)'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: MapStyleType.cartoVoyager,
                              child: Row(
                                children: [
                                  Icon(Icons.wb_sunny_rounded, size: 18, color: AppColors.primary),
                                  SizedBox(width: 10),
                                  Text('Carto Clean'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: MapStyleType.cartoDark,
                              child: Row(
                                children: [
                                  Icon(Icons.dark_mode_rounded, size: 18, color: Colors.indigoAccent),
                                  SizedBox(width: 10),
                                  Text('Find Hub (Mode Gelap)'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: MapStyleType.googleRoadmap,
                              child: Row(
                                children: [
                                  Icon(Icons.map_rounded, size: 18, color: Color(0xFF4285F4)),
                                  SizedBox(width: 10),
                                  Text('Google Maps (Jalan)'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: MapStyleType.googleSatellite,
                              child: Row(
                                children: [
                                  Icon(Icons.satellite_alt_rounded, size: 18, color: Color(0xFF34A853)),
                                  SizedBox(width: 10),
                                  Text('Google Maps (Satelit)'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: MapStyleType.googleTerrain,
                              child: Row(
                                children: [
                                  Icon(Icons.terrain_rounded, size: 18, color: Color(0xFFFBBC05)),
                                  SizedBox(width: 10),
                                  Text('Google Maps (Medan)'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: MapStyleType.cartoDark,
                              child: Row(
                                children: [
                                  Icon(Icons.dark_mode_rounded, size: 18, color: Colors.indigoAccent),
                                  SizedBox(width: 10),
                                  Text('Find Hub (Mode Gelap)'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: MapStyleType.cartoVoyager,
                              child: Row(
                                children: [
                                  Icon(Icons.wb_sunny_rounded, size: 18, color: AppColors.primary),
                                  SizedBox(width: 10),
                                  Text('Carto Clean'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 3. FLOATING ACTION BUTTONS
              AnimatedPositioned(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOutCubic,
                right: 16,
                bottom: _isPanelExpanded ? 320 : 120,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildFloatingMapButton(
                      icon: Icons.zoom_out_map_rounded,
                      iconColor: isDark ? Colors.white : Colors.black87,
                      tooltip: 'Lihat Berdua di Peta',
                      onTap: () => _fitBothLocations(myLatLng, partnerLatLng),
                    ),
                    const SizedBox(height: 8),
                    _buildFloatingMapButton(
                      icon: Icons.favorite_rounded,
                      iconColor: AppColors.primary,
                      tooltip: 'Fokus ke Doi',
                      onTap: () => _centerOnLocation(partnerLatLng, zoom: 16.5),
                    ),
                    const SizedBox(height: 8),
                    _buildFloatingMapButton(
                      icon: Icons.my_location_rounded,
                      iconColor: const Color(0xFF2EC4B6),
                      tooltip: 'Fokus ke Saya',
                      onTap: () => _centerOnLocation(myLatLng, zoom: 16.5),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: (isDark ? AppColors.surfaceDark : Colors.white).withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.08),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          InkWell(
                            onTap: () {
                              try {
                                _mapController.move(_mapController.camera.center, _mapController.camera.zoom + 1);
                              } catch (_) {}
                            },
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              child: Icon(Icons.add_rounded, size: 20),
                            ),
                          ),
                          Container(width: 22, height: 1, color: isDark ? Colors.white12 : Colors.black12),
                          InkWell(
                            onTap: () {
                              try {
                                _mapController.move(_mapController.camera.center, _mapController.camera.zoom - 1);
                              } catch (_) {}
                            },
                            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              child: Icon(Icons.remove_rounded, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 4. BOTTOM FLOATING PANEL
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: SafeArea(
                  top: false,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(
                        color: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.08),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 28,
                          offset: const Offset(0, -6),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => setState(() => _isPanelExpanded = !_isPanelExpanded),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.only(top: 10, bottom: 6),
                            child: Center(
                              child: Container(
                                width: 42,
                                height: 5,
                                decoration: BoxDecoration(
                                  color: Colors.grey.withValues(alpha: 0.4),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Partner Info Bar
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 22,
                                    backgroundColor: AppColors.primaryLight,
                                    backgroundImage: partnerPhotoUrl != null ? NetworkImage(partnerPhotoUrl) : null,
                                    child: partnerPhotoUrl == null
                                        ? Text(
                                            partnerDisplayName.isNotEmpty ? partnerDisplayName[0].toUpperCase() : 'P',
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              partnerDisplayName,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                              decoration: BoxDecoration(
                                                color: AppColors.success.withValues(alpha: 0.15),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                '🔋 $partnerBattery%',
                                                style: const TextStyle(
                                                  color: AppColors.success,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          partnerPlace,
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Live Toggle Switch
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Switch.adaptive(
                                        value: isMyLiveActive,
                                        activeTrackColor: AppColors.success,
                                        onChanged: (val) => _toggleLiveSharing(val),
                                      ),
                                      Text(
                                        isMyLiveActive ? 'Live ON' : 'Live OFF',
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: isMyLiveActive ? AppColors.success : Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),

                              if (_isPanelExpanded) ...[
                                const Divider(height: 20),
                                // Distance & Travel Estimates
                                Row(
                                  children: [
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryLight.withValues(alpha: 0.5),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.near_me_rounded, color: AppColors.primary, size: 16),
                                            const SizedBox(width: 6),
                                            Expanded(
                                              child: Text(
                                                distanceString,
                                                style: const TextStyle(
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                                      decoration: BoxDecoration(
                                        color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.directions_car_rounded, size: 14, color: Colors.blueAccent),
                                          const SizedBox(width: 4),
                                          Text('~$carMinutes mnt', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                          const SizedBox(width: 8),
                                          const Icon(Icons.directions_walk_rounded, size: 14, color: Colors.green),
                                          const SizedBox(width: 4),
                                          Text('~$walkMinutes mnt', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                // Status Note Chips
                                SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: Row(
                                    children: _statusOptions.map((st) {
                                      final isSelected = _selectedStatus == st;
                                      return Padding(
                                        padding: const EdgeInsets.only(right: 6),
                                        child: ChoiceChip(
                                          label: Text(st, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : null)),
                                          selected: isSelected,
                                          selectedColor: AppColors.primary,
                                          onSelected: (selected) async {
                                            if (selected) {
                                              setState(() => _selectedStatus = st);
                                              await repo.updateLocation(
                                                coupleId: coupleId,
                                                uid: user.uid,
                                                displayName: user.displayName,
                                                photoUrl: user.photoUrl,
                                                placeLabel: st,
                                                isLive: isMyLiveActive,
                                              );
                                            }
                                          },
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // Action Buttons Row
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: () => _openNavigation(partnerLatLng.latitude, partnerLatLng.longitude),
                                        icon: const Icon(Icons.navigation_rounded, size: 16),
                                        label: const Text('Navigasi', style: TextStyle(fontSize: 12)),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    if (myLoc != null)
                                      Expanded(
                                        child: FilledButton.icon(
                                          onPressed: () => _shareToChat(myLoc),
                                          icon: const Icon(Icons.share_location_rounded, size: 16),
                                          label: const Text('Kirim ke Chat', style: TextStyle(fontSize: 12)),
                                          style: FilledButton.styleFrom(
                                            backgroundColor: AppColors.primary,
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFloatingMapButton({
    required IconData icon,
    required Color iconColor,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Tooltip(
      message: tooltip,
      child: Material(
        color: (isDark ? AppColors.surfaceDark : Colors.white).withValues(alpha: 0.95),
        shape: const CircleBorder(),
        elevation: 6,
        shadowColor: Colors.black.withValues(alpha: 0.2),
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Icon(icon, color: iconColor, size: 20),
          ),
        ),
      ),
    );
  }

  Widget _buildPinMarker({
    required String name,
    required String? photoUrl,
    required bool isMe,
    required bool isLive,
    required int? batteryLevel,
    required double pulseValue,
  }) {
    final mainColor = isMe ? const Color(0xFF2EC4B6) : AppColors.primary;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            if (isLive && pulseValue > 0.0)
              Transform.scale(
                scale: 1.0 + (pulseValue * 0.45),
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: mainColor.withValues(alpha: (1.0 - pulseValue) * 0.4),
                  ),
                ),
              ),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                border: Border.all(
                  color: isLive ? AppColors.success : mainColor,
                  width: 3.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.28),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipOval(
                child: photoUrl != null && photoUrl.isNotEmpty
                    ? AppImageView(imageUrl: photoUrl, fit: BoxFit.cover)
                    : Container(
                        color: isMe ? const Color(0xFF2EC4B6) : AppColors.primaryLight,
                        child: Center(
                          child: Text(
                            name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: TextStyle(
                              color: isMe ? Colors.white : AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ),
              ),
            ),
            if (batteryLevel != null)
              Positioned(
                top: -4,
                right: -6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.success,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    '$batteryLevel%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            Positioned(
              bottom: -5,
              child: CustomPaint(
                size: const Size(10, 6),
                painter: _PinTrianglePainter(color: isLive ? AppColors.success : mainColor),
              ),
            ),
          ],
        ),
        const SizedBox(height: 7),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.75),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 4,
              ),
            ],
          ),
          child: Text(
            isLive ? '🟢 $name' : name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}

class _PinTrianglePainter extends CustomPainter {
  final Color color;
  _PinTrianglePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width / 2, size.height)
      ..lineTo(size.width, 0)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _PinTrianglePainter oldDelegate) => oldDelegate.color != color;
}

class GoogleMapsCanvasPainter extends CustomPainter {
  final bool isDark;
  GoogleMapsCanvasPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = isDark ? const Color(0xFF1E242B) : const Color(0xFFF2EFE9);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    final waterPaint = Paint()..color = isDark ? const Color(0xFF162D3D) : const Color(0xFFAADAFF);
    final riverPath = Path()
      ..moveTo(-20, size.height * 0.35)
      ..cubicTo(size.width * 0.3, size.height * 0.28, size.width * 0.6, size.height * 0.55, size.width + 20, size.height * 0.48)
      ..lineTo(size.width + 20, size.height * 0.56)
      ..cubicTo(size.width * 0.6, size.height * 0.63, size.width * 0.3, size.height * 0.36, -20, size.height * 0.43)
      ..close();
    canvas.drawPath(riverPath, waterPaint);

    final parkPaint = Paint()..color = isDark ? const Color(0xFF223528) : const Color(0xFFD5E8D4);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.08, size.height * 0.12, 140, 90), const Radius.circular(16)),
      parkPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.62, size.height * 0.68, 120, 80), const Radius.circular(16)),
      parkPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.55, size.height * 0.18, 90, 70), const Radius.circular(14)),
      parkPaint,
    );

    final secondaryRoadPaint = Paint()
      ..color = (isDark ? Colors.white12 : Colors.white)
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke;

    final roadBorderPaint = Paint()
      ..color = (isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFDCD8CF))
      ..strokeWidth = 5.5
      ..style = PaintingStyle.stroke;

    final arterialRoadPaint = Paint()
      ..color = (isDark ? const Color(0xFF384350) : const Color(0xFFFFF7D6))
      ..strokeWidth = 6.0
      ..style = PaintingStyle.stroke;

    final arterialBorderPaint = Paint()
      ..color = (isDark ? Colors.white24 : const Color(0xFFE8DEB5))
      ..strokeWidth = 8.5
      ..style = PaintingStyle.stroke;

    for (double y = 60; y < size.height; y += 75) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), roadBorderPaint);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), secondaryRoadPaint);
    }
    for (double x = 40; x < size.width; x += 85) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), roadBorderPaint);
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), secondaryRoadPaint);
    }

    final highway1 = Path()..moveTo(0, size.height * 0.25)..lineTo(size.width, size.height * 0.75);
    final highway2 = Path()..moveTo(size.width * 0.45, 0)..lineTo(size.width * 0.52, size.height);
    canvas.drawPath(highway1, arterialBorderPaint);
    canvas.drawPath(highway1, arterialRoadPaint);
    canvas.drawPath(highway2, arterialBorderPaint);
    canvas.drawPath(highway2, arterialRoadPaint);
  }

  @override
  bool shouldRepaint(covariant GoogleMapsCanvasPainter oldDelegate) => oldDelegate.isDark != isDark;
}
