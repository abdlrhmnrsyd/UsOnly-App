import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class AppUpdateInfo {
  final String versionName;
  final int versionCode;
  final String apkUrl;
  final String changelog;
  final bool isMandatory;

  AppUpdateInfo({
    required this.versionName,
    required this.versionCode,
    required this.apkUrl,
    required this.changelog,
    this.isMandatory = false,
  });
}

class AppUpdateService {
  static Future<AppUpdateInfo?> checkForUpdate() async {
    try {
      final supabase = Supabase.instance.client;
      final res = await supabase
          .from('app_versions')
          .select('*')
          .order('version_code', ascending: false)
          .limit(1)
          .maybeSingle();

      if (res == null) return null;

      final serverVersionCode = (res['version_code'] as num?)?.toInt() ?? 0;
      final serverVersionName = res['version_name']?.toString() ?? '1.0.0';
      final apkUrl = res['apk_url']?.toString() ?? '';
      final changelog = res['changelog']?.toString() ?? 'Pembaruan aplikasi terbaru.';
      final isMandatory = res['is_mandatory'] == true;

      final packageInfo = await PackageInfo.fromPlatform();
      final currentBuildNumber = int.tryParse(packageInfo.buildNumber) ?? 1;
      final currentVersionName = packageInfo.version;

      final hasUpdate = _hasUpdate(
        serverCode: serverVersionCode,
        serverVersionName: serverVersionName,
        localCode: currentBuildNumber,
        localVersionName: currentVersionName,
      );

      if (hasUpdate && apkUrl.isNotEmpty) {
        return AppUpdateInfo(
          versionName: serverVersionName,
          versionCode: serverVersionCode,
          apkUrl: apkUrl,
          changelog: changelog,
          isMandatory: isMandatory,
        );
      }
    } catch (e) {
      debugPrint('[AppUpdateService] Error checking for update: $e');
    }
    return null;
  }

  static bool _hasUpdate({
    required int serverCode,
    required String serverVersionName,
    required int localCode,
    required String localVersionName,
  }) {
    final normLocal = localCode >= 1000 ? (localCode % 1000) : localCode;
    final normServer = serverCode >= 1000 ? (serverCode % 1000) : serverCode;

    // 1. If already on the same version name and same or lower build code, no update!
    if (serverVersionName.trim() == localVersionName.trim() && normServer <= normLocal) {
      return false;
    }

    // 2. Compare semver names (e.g. "1.0.4" vs "1.0.3")
    final semverCompare = _compareSemver(serverVersionName, localVersionName);
    if (semverCompare > 0) return true;
    if (semverCompare < 0) return false;

    // 3. If version names are identical, check if server build number is newer
    if (normServer > normLocal) return true;
    if (serverCode > localCode && serverCode < 1000 && localCode < 1000) return true;

    return false;
  }

  static int _compareSemver(String a, String b) {
    try {
      final aParts = a.split('.').map((e) => int.tryParse(e) ?? 0).toList();
      final bParts = b.split('.').map((e) => int.tryParse(e) ?? 0).toList();
      for (int i = 0; i < 3; i++) {
        final aVal = i < aParts.length ? aParts[i] : 0;
        final bVal = i < bParts.length ? bParts[i] : 0;
        if (aVal > bVal) return 1;
        if (aVal < bVal) return -1;
      }
    } catch (_) {}
    return 0;
  }

  static Future<void> downloadAndInstall({
    required String apkUrl,
    required void Function(double progress) onProgress,
    required void Function(String error) onError,
  }) async {
    try {
      final client = http.Client();
      final request = http.Request('GET', Uri.parse(apkUrl));
      final response = await client.send(request);

      if (response.statusCode != 200) {
        throw Exception('Gagal mengunduh APK (Status HTTP: ${response.statusCode})');
      }

      final contentLength = response.contentLength ?? 0;
      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/app-update.apk';
      final file = File(filePath);

      final sink = file.openWrite();
      int downloadedBytes = 0;

      await response.stream.listen((chunk) {
        sink.add(chunk);
        downloadedBytes += chunk.length;
        if (contentLength > 0) {
          onProgress(downloadedBytes / contentLength);
        }
      }).asFuture();

      await sink.flush();
      await sink.close();

      onProgress(1.0);

      // Open Android Package Installer
      final result = await OpenFilex.open(filePath, type: 'application/vnd.android.package-archive');
      if (result.type != ResultType.done) {
        // Fallback: open via browser
        await launchUrl(Uri.parse(apkUrl), mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      onError(e.toString());
      try {
        await launchUrl(Uri.parse(apkUrl), mode: LaunchMode.externalApplication);
      } catch (_) {}
    }
  }
}
