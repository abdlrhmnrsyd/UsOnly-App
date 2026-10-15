import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';

final storageRepositoryProvider = Provider<StorageRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return StorageRepository(apiClient);
});

class StorageRepository {
  final ApiClient _apiClient;

  StorageRepository(this._apiClient);

  Future<String> uploadProfilePhoto({
    required String uid,
    required File file,
  }) async {
    return await _apiClient.uploadPhoto(file);
  }

  Future<String> uploadCouplePhoto({
    required String coupleId,
    required File file,
  }) async {
    return await _apiClient.uploadPhoto(file);
  }

  Future<String> uploadChatImage({
    required String conversationId,
    required File file,
  }) async {
    return await _apiClient.uploadPhoto(file);
  }
}
