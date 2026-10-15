import 'package:battery_plus/battery_plus.dart';
import 'package:flutter/foundation.dart';

class BatteryService {
  static final Battery _battery = Battery();

  static Future<int> getBatteryLevel() async {
    try {
      final level = await _battery.batteryLevel;
      return level.clamp(0, 100);
    } catch (e) {
      debugPrint('Battery read notice: $e');
      return 100;
    }
  }

  static Stream<BatteryState> get onBatteryStateChanged => _battery.onBatteryStateChanged;
}
