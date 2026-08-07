import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface Todo {
  id: number;
  user_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: string;
  subject: string | null;
  created_at: string;
}

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/todos?user_id=${user.id}`);
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const addTodo = async (title: string, subject?: string, priority = 'normal') => {
    if (!user) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, title, subject, priority }),
    });
    fetchTodos();
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    });
    fetchTodos();
  };

  const deleteTodo = async (id: number) => {
    await fetch('/api/todos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchTodos();
  };

  return { todos, loading, addTodo, toggleTodo, deleteTodo, refetch: fetchTodos };
}
