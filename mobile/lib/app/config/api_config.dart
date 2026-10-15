import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const String _keyCustomBaseUrl = 'usonly_custom_base_url';

  static String get defaultHost => 'https://usonlyapp-y5vbp4nl.b4a.run';

  static String _baseUrl = defaultHost;

  static String get baseUrl => _baseUrl;
  static String get apiUrl => '$_baseUrl/api';
  static String get socketUrl => _baseUrl;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final custom = prefs.getString(_keyCustomBaseUrl);
    if (custom != null && custom.isNotEmpty) {
      _baseUrl = custom;
    } else {
      _baseUrl = defaultHost;
    }
  }

  static Future<void> setCustomBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
    await prefs.setString(_keyCustomBaseUrl, _baseUrl);
  }

  static String? resolveMediaUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('http://localhost:5000')) {
      return url.replaceFirst('http://localhost:5000', _baseUrl);
    }
    if (url.startsWith('/')) {
      return '$_baseUrl$url';
    }
    return url;
  }
}
