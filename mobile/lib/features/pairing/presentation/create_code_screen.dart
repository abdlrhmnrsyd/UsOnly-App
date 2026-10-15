import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../domain/pairing_state.dart';

class CreateCodeScreen extends ConsumerStatefulWidget {
  const CreateCodeScreen({super.key});

  @override
  ConsumerState<CreateCodeScreen> createState() => _CreateCodeScreenState();
}

class _CreateCodeScreenState extends ConsumerState<CreateCodeScreen> {
  Timer? _timer;
  int _secondsRemaining = 172800; // 48 hours

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(pairingStateProvider.notifier).createCode();
      _startCountdown();
    });
  }

  void _startCountdown() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_secondsRemaining > 0) {
        setState(() => _secondsRemaining--);
      } else {
        timer.cancel();
      }
    });
  }

  String get _formattedTime {
    final hours = _secondsRemaining ~/ 3600;
    final minutes = (_secondsRemaining % 3600) ~/ 60;
    final seconds = _secondsRemaining % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pairingStateProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    ref.listen<PairingState>(pairingStateProvider, (previous, next) {
      if (next.pairedPartnerUid != null && next.pairedPartnerUid!.isNotEmpty) {
        context.go('/pairing/success');
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Connection Code'),
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 20.0),
                child: Column(
                  children: [
                    const Spacer(),
                    if (state.error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 32),
                            const SizedBox(height: 8),
                            Text(
                              state.error!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 12),
                            FilledButton.tonalIcon(
                              onPressed: () {
                                ref.read(pairingStateProvider.notifier).createCode();
                                _startCountdown();
                              },
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('Coba Lagi'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ] else ...[
                      Text(
                        'share this with your person',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    // Romantic code card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.08),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          SelectableText(
                            state.activeCode ?? '------',
                            style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 6,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.timer_outlined,
                                size: 18,
                                color: _secondsRemaining < 60 ? AppColors.error : AppColors.textSecondaryLight,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'expires in $_formattedTime',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: _secondsRemaining < 60 ? AppColors.error : AppColors.textSecondaryLight,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Copy button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: state.activeCode == null
                            ? null
                            : () {
                                Clipboard.setData(ClipboardData(text: state.activeCode!));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Code copied to clipboard!')),
                                );
                              },
                        icon: const Icon(Icons.copy_rounded, size: 20),
                        label: const Text('copy code'),
                        style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                    const Spacer(),
                    // Waiting status indicator
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'waiting for your person to connect...',
                          style: TextStyle(
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
      ),
    );
  }
}
