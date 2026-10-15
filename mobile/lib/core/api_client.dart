import 'dart:convert';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../app/config/api_config.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  static const String _keyToken = 'our_space_token';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
  }

  Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
  }

  Future<Map<String, String>> _headers({bool isJson = true}) async {
    final headers = <String, String>{};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}$endpoint');
    final response = await http.get(uri, headers: await _headers());
    return _handleResponse(response);
  }

  Future<dynamic> post(String endpoint, [Map<String, dynamic>? data]) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}$endpoint');
    final response = await http.post(
      uri,
      headers: await _headers(),
      body: data != null ? jsonEncode(data) : jsonEncode({}),
    );
    return _handleResponse(response);
  }

  Future<dynamic> put(String endpoint, [Map<String, dynamic>? data]) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}$endpoint');
    final response = await http.put(
      uri,
      headers: await _headers(),
      body: data != null ? jsonEncode(data) : jsonEncode({}),
    );
    return _handleResponse(response);
  }

  Future<dynamic> patch(String endpoint, [Map<String, dynamic>? data]) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}$endpoint');
    final response = await http.patch(
      uri,
      headers: await _headers(),
      body: data != null ? jsonEncode(data) : jsonEncode({}),
    );
    return _handleResponse(response);
  }

  Future<dynamic> delete(String endpoint) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}$endpoint');
    final response = await http.delete(uri, headers: await _headers());
    return _handleResponse(response);
  }

  Future<String> uploadPhoto(File file) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}/upload');
    final request = http.MultipartRequest('POST', uri);
    final headers = await _headers(isJson: false);
    request.headers.addAll(headers);

    request.files.add(await http.MultipartFile.fromPath('photo', file.path));
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    final result = _handleResponse(response);
    if (result is Map && result['url'] != null) {
      String url = result['url'].toString();
      if (url.startsWith('/')) {
        url = '${ApiConfig.baseUrl}$url';
      }
      return url;
    }
    throw Exception('Gagal mendapatkan URL foto dari server.');
  }

  dynamic _handleResponse(http.Response res) {
    dynamic body;
    try {
      body = jsonDecode(res.body);
    } catch (_) {
      body = {'message': res.body};
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body;
    }

    final message = (body is Map && body['message'] != null)
        ? body['message'].toString()
        : 'Terjadi kesalahan (${res.statusCode})';
    throw ApiException(message, res.statusCode);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
