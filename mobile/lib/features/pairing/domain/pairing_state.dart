import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/socket_service.dart';
import '../../auth/domain/auth_state.dart';
import '../data/pairing_repository.dart';

final pairingRepositoryProvider = Provider<PairingRepository>((ref) {
  return PairingRepository();
});

class PairingState {
  final bool isLoading;
  final String? activeCode;
  final String? pairedPartnerUid;
  final String? error;

  const PairingState({
    this.isLoading = false,
    this.activeCode,
    this.pairedPartnerUid,
    this.error,
  });

  PairingState copyWith({
    bool? isLoading,
    String? activeCode,
    String? pairedPartnerUid,
    String? error,
  }) {
    return PairingState(
      isLoading: isLoading ?? this.isLoading,
      activeCode: activeCode ?? this.activeCode,
      pairedPartnerUid: pairedPartnerUid ?? this.pairedPartnerUid,
      error: error,
    );
  }
}

class PairingNotifier extends Notifier<PairingState> {
  StreamSubscription? _socketSub;

  @override
  PairingState build() {
    ref.onDispose(() {
      _socketSub?.cancel();
    });

    _listenToPartnerJoined();
    _checkActiveCode();
    return const PairingState();
  }

  void _listenToPartnerJoined() {
    final socket = ref.read(socketServiceProvider);
    _socketSub?.cancel();
    _socketSub = socket.onPartnerJoined.listen((data) {
      ref.read(authStateProvider.notifier).checkAuth();
      state = state.copyWith(
        pairedPartnerUid: data['partner']?['id']?.toString() ?? 'partner',
      );
    });
  }

  Future<void> _checkActiveCode() async {
    final active = await ref.read(pairingRepositoryProvider).getActiveCode();
    if (active != null && active.isNotEmpty) {
      state = state.copyWith(activeCode: active);
    }
  }

  Future<void> createCode() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await ref.read(pairingRepositoryProvider).createCode();
      final code = res['code']?.toString();
      state = state.copyWith(
        isLoading: false,
        activeCode: code,
      );
      await ref.read(authStateProvider.notifier).checkAuth();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> redeemCode(String code) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final success = await ref.read(pairingRepositoryProvider).redeemCode(code);
      if (success) {
        state = state.copyWith(isLoading: false, pairedPartnerUid: 'partner');
        await ref.read(authStateProvider.notifier).checkAuth();
        return true;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Kode tidak valid atau sudah kadaluwarsa.',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final pairingStateProvider = NotifierProvider<PairingNotifier, PairingState>(PairingNotifier.new);
