import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final storageRepositoryProvider = Provider<StorageRepository>((ref) {
  return StorageRepository();
});

class StorageRepository {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<String> uploadPhoto(File file) async {
    final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.path.split(Platform.pathSeparator).last}';
    final path = 'uploads/$fileName';

    await _supabase.storage.from('our-space-media').upload(
      path,
      file,
      fileOptions: const FileOptions(cacheControl: '3600', upsert: true),
    );

    return _supabase.storage.from('our-space-media').getPublicUrl(path);
  }

  Future<String> uploadProfilePhoto({
    required String uid,
    required File file,
  }) async {
    return await uploadPhoto(file);
  }

  Future<String> uploadCouplePhoto({
    required String coupleId,
    required File file,
  }) async {
    return await uploadPhoto(file);
  }

  Future<String> uploadChatImage({
    required String conversationId,
    required File file,
  }) async {
    return await uploadPhoto(file);
  }
}
