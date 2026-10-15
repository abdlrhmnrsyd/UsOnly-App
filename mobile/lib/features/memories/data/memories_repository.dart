import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../domain/memory_model.dart';

final memoriesRepositoryProvider = Provider<MemoriesRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MemoriesRepository(apiClient);
});

class MemoriesRepository {
  final ApiClient _apiClient;
  final StreamController<List<MemoryModel>> _memoriesStreamController =
      StreamController<List<MemoryModel>>.broadcast();
  Timer? _pollingTimer;

  MemoriesRepository(this._apiClient);

  Stream<List<MemoryModel>> watchMemories(String coupleId) {
    // Initial fetch
    fetchMemories();

    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) => fetchMemories());

    return _memoriesStreamController.stream;
  }

  Future<List<MemoryModel>> fetchMemories() async {
    try {
      final res = await _apiClient.get('/pap');
      if (res['success'] == true && res['memories'] is List) {
        final list = (res['memories'] as List)
            .map((m) => MemoryModel.fromJson(Map<String, dynamic>.from(m)))
            .toList();
        _memoriesStreamController.add(list);
        return list;
      }
    } catch (e) {
      debugPrint('Error fetching memories: $e');
    }
    return [];
  }

  Future<MemoryModel?> createMemory({
    required String coupleId,
    required String title,
    String? description,
    String? mediaUrl,
    required DateTime memoryDate,
    required String createdBy,
    String? locationName,
    double? latitude,
    double? longitude,
    int? batteryLevel,
  }) async {
    try {
      final res = await _apiClient.post('/pap', {
        'title': title,
        'story': description,
        'memory_date': memoryDate.toIso8601String(),
        'photos': mediaUrl != null ? [mediaUrl] : [],
        'location_name': locationName,
        'latitude': latitude,
        'longitude': longitude,
        'battery_level': batteryLevel,
      });

      await fetchMemories();

      if (res['memory'] != null) {
        return MemoryModel.fromJson(Map<String, dynamic>.from(res['memory']));
      }
    } catch (e) {
      debugPrint('Error creating memory: $e');
      rethrow;
    }
    return null;
  }

  Future<void> deleteMemory(String coupleId, String memoryId) async {
    try {
      await _apiClient.delete('/pap/$memoryId');
      await fetchMemories();
    } catch (e) {
      debugPrint('Error deleting memory: $e');
    }
  }

  Future<void> toggleFavorite(String memoryId) async {
    try {
      await _apiClient.patch('/pap/$memoryId/favorite');
      await fetchMemories();
    } catch (e) {
      debugPrint('Error toggling favorite: $e');
    }
  }

  void dispose() {
    _pollingTimer?.cancel();
    _memoriesStreamController.close();
  }
}
