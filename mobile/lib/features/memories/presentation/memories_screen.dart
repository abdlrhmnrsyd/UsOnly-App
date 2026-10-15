import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';
import '../../auth/domain/auth_state.dart';
import '../../media/presentation/app_image_view.dart';
import '../data/memories_repository.dart';
import '../domain/memory_model.dart';

class MemoriesScreen extends ConsumerWidget {
  const MemoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (user == null || user.coupleId == null) {
      return const Scaffold(
        body: Center(child: Text('Pair with your partner to view shared memories.')),
      );
    }

    final coupleId = user.coupleId!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Our Memories & PAP'),
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        elevation: 0.5,
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () => context.push('/memories/create'),
        child: const Icon(Icons.add_photo_alternate_rounded, color: Colors.white),
      ),
      body: StreamBuilder<List<MemoryModel>>(
        stream: ref.watch(memoriesRepositoryProvider).watchMemories(coupleId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final memories = snapshot.data ?? [];
          if (memories.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    size: 48,
                    color: AppColors.primary.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'no memories recorded yet.',
                    style: TextStyle(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'tap + to preserve your first special moment together.',
                    style: TextStyle(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            itemCount: memories.length,
            itemBuilder: (context, index) {
              final item = memories[index];
              final dateStr = DateFormat('MMMM d, yyyy • HH:mm').format(item.memoryDate);

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                clipBehavior: Clip.antiAlias,
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (item.mediaUrl != null && item.mediaUrl!.isNotEmpty)
                      AppImageView(
                        imageUrl: item.mediaUrl!,
                        height: 240,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                dateStr,
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    icon: Icon(
                                      item.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                      size: 20,
                                      color: item.isFavorite ? AppColors.primary : AppColors.textSecondaryLight,
                                    ),
                                    onPressed: () {
                                      ref.read(memoriesRepositoryProvider).toggleFavorite(item.id);
                                    },
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline_rounded, size: 20),
                                    color: AppColors.textSecondaryLight,
                                    onPressed: () {
                                      ref.read(memoriesRepositoryProvider).deleteMemory(coupleId, item.id);
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.title,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                            ),
                          ),
                          if (item.description != null && item.description!.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              item.description!,
                              style: TextStyle(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                height: 1.4,
                              ),
                            ),
                          ],
                          if (item.locationName != null || item.batteryLevel != null) ...[
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              children: [
                                if (item.locationName != null && item.locationName!.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.location_on_rounded, size: 12, color: AppColors.primary),
                                        const SizedBox(width: 4),
                                        Text(
                                          item.locationName!,
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                                        ),
                                      ],
                                    ),
                                  ),
                                if (item.batteryLevel != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.success.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.battery_charging_full_rounded, size: 12, color: AppColors.success),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${item.batteryLevel}%',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.success),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
