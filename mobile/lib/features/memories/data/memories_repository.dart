import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/memory_model.dart';

final memoriesRepositoryProvider = Provider<MemoriesRepository>((ref) {
  return MemoriesRepository();
});

class MemoriesRepository {
  SupabaseClient get _supabase => Supabase.instance.client;

  final StreamController<List<MemoryModel>> _memoriesStreamController =
      StreamController<List<MemoryModel>>.broadcast();
  Timer? _pollingTimer;

  MemoriesRepository();

  Stream<List<MemoryModel>> watchMemories(String coupleId) {
    fetchMemories(coupleId);

    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => fetchMemories(coupleId),
    );

    return _memoriesStreamController.stream;
  }

  Future<List<MemoryModel>> fetchMemories([String? spaceId]) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return [];

      var query = _supabase.from('memories').select('*');
      if (spaceId != null && spaceId.isNotEmpty) {
        query = query.eq('space_id', spaceId);
      }
      final res = await query.order('memory_date', ascending: false);

      final list = res
          .map((m) => MemoryModel.fromJson(Map<String, dynamic>.from(m)))
          .toList();
      _memoriesStreamController.add(list);
      return list;
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
      final user = _supabase.auth.currentUser;
      final uid = user?.id ?? createdBy;

      String actualSpaceId = coupleId;
      if (actualSpaceId.isEmpty && user != null) {
        final profile = await _supabase
            .from('profiles')
            .select('space_id')
            .eq('id', user.id)
            .maybeSingle();
        actualSpaceId = profile?['space_id']?.toString() ?? '';
      }

      final photos = mediaUrl != null ? [mediaUrl] : [];

      final row = {
        'space_id': actualSpaceId,
        'created_by': uid,
        'title': title,
        'story': description ?? '',
        'memory_date': memoryDate.toIso8601String().split('T')[0],
        'photos': photos,
        'location_name': locationName,
        'is_favorite': false,
        'created_at': DateTime.now().toIso8601String(),
      };

      final inserted = await _supabase
          .from('memories')
          .insert(row)
          .select()
          .single();

      await fetchMemories(actualSpaceId);

      return MemoryModel.fromJson(Map<String, dynamic>.from(inserted));
    } catch (e) {
      debugPrint('Error creating memory: $e');
      rethrow;
    }
  }

  Future<void> deleteMemory(String coupleId, String memoryId) async {
    try {
      await _supabase.from('memories').delete().eq('id', memoryId);
      await fetchMemories(coupleId);
    } catch (e) {
      debugPrint('Error deleting memory: $e');
    }
  }

  Future<void> toggleFavorite(String memoryId) async {
    try {
      final current = await _supabase
          .from('memories')
          .select('is_favorite')
          .eq('id', memoryId)
          .maybeSingle();
      final isFav = current?['is_favorite'] == true;
      await _supabase
          .from('memories')
          .update({'is_favorite': !isFav})
          .eq('id', memoryId);
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
