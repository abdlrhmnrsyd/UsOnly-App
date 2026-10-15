import 'dart:math';
import 'package:supabase_flutter/supabase_flutter.dart';

class PairingRepository {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<Map<String, dynamic>> createCode() async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Belum login');

    // 1. Try PostgreSQL RPC function first (bypasses RLS issues safely)
    try {
      final rpcRes = await _supabase.rpc('create_pairing_code');
      if (rpcRes is Map) {
        if (rpcRes['success'] == true) {
          return {
            'code': rpcRes['code']?.toString() ?? '',
            'expires_at': rpcRes['expires_at']?.toString() ?? '',
          };
        } else if (rpcRes['message'] != null) {
          throw Exception(rpcRes['message'].toString());
        }
      }
    } catch (e) {
      final errStr = e.toString().toLowerCase();
      if (errStr.contains('belum login')) {
        rethrow;
      }
      // Fallback below if RPC is not yet registered in database
    }

    // 2. Check if user already has an active code
    final activeCode = await getActiveCode();
    if (activeCode != null && activeCode.isNotEmpty) {
      return {
        'code': activeCode,
        'expires_at': DateTime.now().add(const Duration(hours: 24)).toIso8601String(),
      };
    }

    // 3. Fallback: Direct table operations
    final profile = await _supabase
        .from('profiles')
        .select('space_id, nickname')
        .eq('id', user.id)
        .maybeSingle();

    String? spaceId = profile?['space_id']?.toString();

    // Create space if not exists
    if (spaceId == null || spaceId.isEmpty) {
      final space = await _supabase.from('couple_spaces').insert({
        'created_by': user.id,
        'name': 'Ruang Kita',
        'status': 'pending',
      }).select().single();

      spaceId = space['id'].toString();

      final existingMember = await _supabase
          .from('couple_members')
          .select('user_id')
          .eq('couple_id', spaceId)
          .eq('user_id', user.id)
          .maybeSingle();

      if (existingMember == null) {
        await _supabase.from('couple_members').insert({
          'couple_id': spaceId,
          'user_id': user.id,
        });
      }

      await _supabase.from('profiles').update({
        'space_id': spaceId,
      }).eq('id', user.id);
    } else {
      final existingMember = await _supabase
          .from('couple_members')
          .select('user_id')
          .eq('couple_id', spaceId)
          .eq('user_id', user.id)
          .maybeSingle();

      if (existingMember == null) {
        await _supabase.from('couple_members').insert({
          'couple_id': spaceId,
          'user_id': user.id,
        });
      }
    }

    // Generate readable code: KITA-XXXX
    final chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final random = Random();
    final randomPart = List.generate(4, (_) => chars[random.nextInt(chars.length)]).join();
    final code = 'KITA-$randomPart';

    final expiresAt = DateTime.now().add(const Duration(hours: 24));

    await _supabase.from('invitations').insert({
      'couple_id': spaceId,
      'code_hash': code,
      'created_by': user.id,
      'expires_at': expiresAt.toIso8601String(),
    });

    return {
      'code': code,
      'expires_at': expiresAt.toIso8601String(),
    };
  }

  Future<String?> getActiveCode() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return null;

      final invite = await _supabase
          .from('invitations')
          .select('code_hash, expires_at')
          .eq('created_by', user.id)
          .isFilter('used_at', null)
          .gt('expires_at', DateTime.now().toIso8601String())
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      return invite?['code_hash']?.toString();
    } catch (_) {
      return null;
    }
  }

  Future<bool> redeemCode(String code) async {
    final cleanCode = code.trim().toUpperCase();

    // 1. Try PostgreSQL RPC function first
    try {
      final rpcRes = await _supabase.rpc('join_couple_space', params: {'invite_code': cleanCode});
      if (rpcRes is Map) {
        if (rpcRes['success'] == true) {
          return true;
        } else if (rpcRes['message'] != null) {
          throw Exception(rpcRes['message'].toString());
        }
      }
    } catch (e) {
      final msg = e.toString().toLowerCase();
      if (msg.contains('sendiri') || 
          msg.contains('tidak valid') || 
          msg.contains('penuh') || 
          msg.contains('kadaluwarsa')) {
        rethrow;
      }
    }

    // 2. Fallback: direct table operations
    final user = _supabase.auth.currentUser;
    if (user == null) return false;

    final invite = await _supabase
        .from('invitations')
        .select('*')
        .eq('code_hash', cleanCode)
        .isFilter('used_at', null)
        .gt('expires_at', DateTime.now().toIso8601String())
        .maybeSingle();

    if (invite == null) return false;
    final coupleId = invite['couple_id'];

    if (invite['created_by'] == user.id) {
      throw Exception('Kamu tidak bisa memasukkan kode yang kamu buat sendiri.');
    }

    final existingMember = await _supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existingMember == null) {
      await _supabase.from('couple_members').insert({
        'couple_id': coupleId,
        'user_id': user.id,
      });
    }

    await _supabase.from('profiles').update({
      'space_id': coupleId,
    }).eq('id', user.id);

    await _supabase.from('couple_spaces').update({
      'status': 'paired',
    }).eq('id', coupleId);

    await _supabase.from('invitations').update({
      'used_at': DateTime.now().toIso8601String(),
      'used_by': user.id,
    }).eq('id', invite['id']);

    return true;
  }

  Future<void> leaveSpace() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    final profile = await _supabase
        .from('profiles')
        .select('space_id')
        .eq('id', user.id)
        .maybeSingle();

    final spaceId = profile?['space_id'];
    if (spaceId != null) {
      await _supabase.from('couple_members').delete().eq('couple_id', spaceId).eq('user_id', user.id);
      await _supabase.from('profiles').update({'space_id': null}).eq('id', user.id);
    }
  }
}
