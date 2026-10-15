import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';
import 'app/config/api_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize dynamic backend configuration (Android emulator, LAN IP, or localhost)
  await ApiConfig.init();

  runApp(
    const ProviderScope(
      child: UsOnlyApp(),
    ),
  );
}
