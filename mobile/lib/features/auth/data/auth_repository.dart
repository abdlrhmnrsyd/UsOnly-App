import '../../../core/api_client.dart';
import '../domain/user_model.dart';

class AuthRepository {
  final ApiClient _client;

  AuthRepository([ApiClient? client]) : _client = client ?? ApiClient();

  Future<UserModel> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final res = await _client.post('/auth/register', {
      'email': email.trim().toLowerCase(),
      'password': password,
      'fullName': displayName.trim(),
      'nickname': displayName.trim(),
    });

    if (res['token'] != null) {
      await _client.saveToken(res['token'].toString());
    }

    if (res['user'] != null) {
      return UserModel.fromJson(Map<String, dynamic>.from(res['user']));
    }
    throw Exception('Data pengguna tidak ditemukan dari server.');
  }

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    final res = await _client.post('/auth/login', {
      'email': email.trim().toLowerCase(),
      'password': password,
    });

    if (res['token'] != null) {
      await _client.saveToken(res['token'].toString());
    }

    if (res['user'] != null) {
      return UserModel.fromJson(Map<String, dynamic>.from(res['user']));
    }
    throw Exception('Data pengguna tidak ditemukan dari server.');
  }

  Future<UserModel> quickLogin(String role) async {
    final res = await _client.post('/auth/quick-login/$role');
    if (res['token'] != null) {
      await _client.saveToken(res['token'].toString());
    }
    if (res['user'] != null) {
      return UserModel.fromJson(Map<String, dynamic>.from(res['user']));
    }
    throw Exception('Gagal masuk akun demo.');
  }

  Future<Map<String, dynamic>> getMe() async {
    final res = await _client.get('/auth/me');
    return Map<String, dynamic>.from(res);
  }

  Future<void> updateProfile({
    String? displayName,
    String? nickname,
    String? bio,
    String? photoUrl,
    String? statusText,
  }) async {
    final data = <String, dynamic>{};
    if (displayName != null) data['full_name'] = displayName;
    if (nickname != null) data['nickname'] = nickname;
    if (bio != null) data['bio'] = bio;
    if (photoUrl != null) data['avatar_url'] = photoUrl;
    if (statusText != null) data['status_text'] = statusText;
    await _client.put('/auth/profile', data);
  }

  Future<void> logout() async {
    await _client.removeToken();
  }
}
