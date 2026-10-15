import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app/app.dart';
import 'app/config/api_config.dart';
import 'app/config/supabase_config.dart';

import 'core/background_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase Native
  await Supabase.initialize(
    url: SupabaseConfig.url,
    publishableKey: SupabaseConfig.publishableKey,
  );

  // Initialize Background Service & Notifications
  try {
    await AppBackgroundService.initialize();
  } catch (e) {
    debugPrint('Background service init notice: $e');
  }

  // Initialize dynamic backend configuration fallback
  await ApiConfig.init();

  runApp(
    const ProviderScope(
      child: UsOnlyApp(),
    ),
  );
}
