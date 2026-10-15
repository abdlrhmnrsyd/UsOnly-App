import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/socket_service.dart';
import '../data/auth_repository.dart';
import 'user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final UserModel? partner;
  final Map<String, dynamic>? space;
  final String? errorMessage;

  const AuthState({
    required this.status,
    this.user,
    this.partner,
    this.space,
    this.errorMessage,
  });

  factory AuthState.initial() => const AuthState(status: AuthStatus.initial);

  bool get isPaired => partner != null || (space != null && space!['partner2_id'] != null);

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    UserModel? partner,
    Map<String, dynamic>? space,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      partner: partner ?? this.partner,
      space: space ?? this.space,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _checkInitialAuth();
    return AuthState.initial();
  }

  Future<void> _checkInitialAuth() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final res = await repo.getMe();
      if (res['success'] == true && res['user'] != null) {
        final user = UserModel.fromJson(Map<String, dynamic>.from(res['user']));
        UserModel? partner;
        if (res['partner'] != null) {
          partner = UserModel.fromJson(Map<String, dynamic>.from(res['partner']));
        }
        final space = res['space'] != null ? Map<String, dynamic>.from(res['space']) : null;

        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
          partner: partner,
          space: space,
        );

        if (space != null && user.uid.isNotEmpty) {
          ref.read(socketServiceProvider).connect(
                spaceId: space['id'].toString(),
                userId: user.uid,
              );
        }
        return;
      }
    } catch (_) {}
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> checkAuth() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final res = await repo.getMe();
      if (res['success'] == true && res['user'] != null) {
        final user = UserModel.fromJson(Map<String, dynamic>.from(res['user']));
        UserModel? partner;
        if (res['partner'] != null) {
          partner = UserModel.fromJson(Map<String, dynamic>.from(res['partner']));
        }
        final space = res['space'] != null ? Map<String, dynamic>.from(res['space']) : null;

        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          partner: partner,
          space: space,
        );

        if (space != null && user.uid.isNotEmpty) {
          ref.read(socketServiceProvider).connect(
                spaceId: space['id'].toString(),
                userId: user.uid,
              );
        }
      }
    } catch (_) {}
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final user = await ref.read(authRepositoryProvider).login(
            email: email,
            password: password,
          );
      state = AuthState(status: AuthStatus.authenticated, user: user);
      await checkAuth();
    } catch (e) {
      state = AuthState(status: AuthStatus.error, errorMessage: e.toString());
    }
  }

  Future<void> quickLogin(String role) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final user = await ref.read(authRepositoryProvider).quickLogin(role);
      state = AuthState(status: AuthStatus.authenticated, user: user);
      await checkAuth();
    } catch (e) {
      state = AuthState(status: AuthStatus.error, errorMessage: e.toString());
    }
  }

  Future<void> register(String email, String password, String displayName) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final user = await ref.read(authRepositoryProvider).register(
            email: email,
            password: password,
            displayName: displayName,
          );
      state = AuthState(status: AuthStatus.authenticated, user: user);
      await checkAuth();
    } catch (e) {
      state = AuthState(status: AuthStatus.error, errorMessage: e.toString());
    }
  }

  Future<void> checkAuthStatus() async {
    await checkAuth();
  }

  Future<void> deleteAccount() async {
    await logout();
  }

  Future<void> logout() async {
    ref.read(socketServiceProvider).disconnect();
    await ref.read(authRepositoryProvider).logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
