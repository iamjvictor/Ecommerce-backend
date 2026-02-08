import { supabase } from '../lib/supabase';
import { UsersRepository } from '../repositories/users';

export class AuthService {
  private usersRepository: UsersRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
  }

  async signup(email: string, password: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await this.usersRepository.create({
        id: data.user.id,
        email: data.user.email!,
        name: name || null,
      });
    }

    return data;
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async logout(token: string) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(userId: string) {
    return this.usersRepository.findById(userId);
  }
}
