import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/user_model.dart';

class AuthRepository {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<UserModel> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final cleanEmail = email.trim().toLowerCase();
    final res = await _supabase.auth.signUp(
      email: cleanEmail,
      password: password,
      data: {
        'display_name': displayName.trim(),
        'nickname': displayName.trim(),
      },
    );

    final user = res.user;
    if (user == null) {
      throw Exception('Pendaftaran gagal. Silakan coba lagi.');
    }

    // If session is null (due to Supabase email confirm setting), attempt sign in
    if (res.session == null) {
      try {
        await _supabase.auth.signInWithPassword(email: cleanEmail, password: password);
      } catch (_) {}
    }

    // Upsert into public.profiles
    final defaultAvatar =
        'https://api.dicebear.com/7.x/adventurer/svg?seed=${Uri.encodeComponent(displayName.trim())}';
    final profileData = {
      'id': user.id,
      'email': cleanEmail,
      'display_name': displayName.trim(),
      'nickname': displayName.trim(),
      'avatar_url': defaultAvatar,
      'bio': 'Ruang cinta kita berdua ❤️',
      'theme_preference': 'dark',
      'status_text': 'Online',
      'battery_level': 100,
      'updated_at': DateTime.now().toIso8601String(),
    };

    try {
      await _supabase.from('profiles').upsert(profileData);
    } catch (_) {}

    return UserModel.fromJson(profileData);
  }

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    final cleanEmail = email.trim().toLowerCase();
    final res = await _supabase.auth.signInWithPassword(
      email: cleanEmail,
      password: password,
    );

    final user = res.user;
    if (user == null) {
      throw Exception('Login gagal. Periksa kembali email dan kata sandi.');
    }

    // Fetch profile
    final profileRes = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profileRes != null) {
      return UserModel.fromJson(Map<String, dynamic>.from(profileRes));
    }

    // Self-heal: create profile if missing
    final defaultAvatar =
        'https://api.dicebear.com/7.x/adventurer/svg?seed=${Uri.encodeComponent(cleanEmail)}';
    final newProfile = {
      'id': user.id,
      'email': cleanEmail,
      'display_name': user.userMetadata?['display_name'] ?? cleanEmail.split('@').first,
      'nickname': user.userMetadata?['nickname'] ?? cleanEmail.split('@').first,
      'avatar_url': defaultAvatar,
      'bio': 'Ruang cinta kita berdua ❤️',
      'theme_preference': 'dark',
      'status_text': 'Online',
      'battery_level': 100,
      'updated_at': DateTime.now().toIso8601String(),
    };

    try {
      await _supabase.from('profiles').upsert(newProfile);
    } catch (_) {}

    return UserModel.fromJson(newProfile);
  }

  Future<UserModel> quickLogin(String role) async {
    final email = role.toLowerCase() == 'asit' ? 'asit@ourspace.id' : 'nisya@ourspace.id';
    return await login(email: email, password: 'password123');
  }

  Future<Map<String, dynamic>> getMe() async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      return {'success': false, 'message': 'Belum login'};
    }

    var profileRes = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profileRes == null) {
      // Self-heal: create missing profile automatically!
      final defaultAvatar =
          'https://api.dicebear.com/7.x/adventurer/svg?seed=${Uri.encodeComponent(user.email ?? 'User')}';
      final newProfile = {
        'id': user.id,
        'email': user.email ?? '',
        'display_name': user.userMetadata?['display_name'] ?? user.email?.split('@').first ?? 'User',
        'nickname': user.userMetadata?['nickname'] ?? user.email?.split('@').first ?? 'User',
        'avatar_url': defaultAvatar,
        'bio': 'Ruang cinta kita berdua ❤️',
        'theme_preference': 'dark',
        'status_text': 'Online',
        'battery_level': 100,
        'updated_at': DateTime.now().toIso8601String(),
      };
      try {
        await _supabase.from('profiles').upsert(newProfile);
      } catch (_) {}
      profileRes = newProfile;
    }

    final userMap = Map<String, dynamic>.from(profileRes);
    final spaceId = userMap['space_id']?.toString();

    Map<String, dynamic>? spaceMap;
    Map<String, dynamic>? partnerMap;

    if (spaceId != null && spaceId.isNotEmpty) {
      // Fetch space
      final spaceRes = await _supabase
          .from('couple_spaces')
          .select('*')
          .eq('id', spaceId)
          .maybeSingle();
      if (spaceRes != null) {
        spaceMap = Map<String, dynamic>.from(spaceRes);
      }

      // Fetch partner from couple_members
      final membersRes = await _supabase
          .from('couple_members')
          .select('user_id')
          .eq('couple_id', spaceId)
          .neq('user_id', user.id)
          .maybeSingle();

      if (membersRes != null && membersRes['user_id'] != null) {
        final partnerId = membersRes['user_id'].toString();
        final partnerProfileRes = await _supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .maybeSingle();
        if (partnerProfileRes != null) {
          partnerMap = Map<String, dynamic>.from(partnerProfileRes);
        }
      }
    }

    return {
      'success': true,
      'user': userMap,
      'space': spaceMap,
      'partner': partnerMap,
    };
  }

  Future<void> updateProfile({
    String? displayName,
    String? nickname,
    String? bio,
    String? photoUrl,
    String? statusText,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    final updates = <String, dynamic>{
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (displayName != null) updates['display_name'] = displayName;
    if (nickname != null) updates['nickname'] = nickname;
    if (bio != null) updates['bio'] = bio;
    if (photoUrl != null) updates['avatar_url'] = photoUrl;
    if (statusText != null) updates['status_text'] = statusText;

    await _supabase.from('profiles').update(updates).eq('id', user.id);
  }

  Future<void> logout() async {
    await _supabase.auth.signOut();
  }
}
