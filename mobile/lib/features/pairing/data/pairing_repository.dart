import '../../../core/api_client.dart';

class PairingRepository {
  final ApiClient _client;

  PairingRepository([ApiClient? client]) : _client = client ?? ApiClient();

  Future<Map<String, dynamic>> createCode() async {
    final res = await _client.post('/space/invite');
    if (res['invitation'] != null) {
      return Map<String, dynamic>.from(res['invitation']);
    }
    throw Exception('Gagal membuat kode pairing dari server.');
  }

  Future<String?> getActiveCode() async {
    try {
      final res = await _client.get('/space/invite');
      if (res['invitation'] != null && res['invitation']['code'] != null) {
        return res['invitation']['code'].toString();
      }
    } catch (_) {}
    return null;
  }

  Future<bool> redeemCode(String code) async {
    final res = await _client.post('/space/join', {
      'code': code.trim().toUpperCase(),
    });
    return res['success'] == true;
  }

  Future<void> leaveSpace() async {
    await _client.post('/space/leave');
  }
}
