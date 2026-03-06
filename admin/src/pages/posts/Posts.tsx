import { useState, useEffect } from 'react';
import { Trash2, Star } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Post {
  _id: string;
  userId?: { name: string; profilePicture?: string };
  mediaUrl: string;
  caption: string;
  isFeatured: boolean;
  createdAt: string;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get('/admin/economy/posts/admin'); // Placeholder if you have separate admin posts route
      setPosts(response.data);
    } catch (e) {
      // Fallback to general feed if admin route fails
      try {
        const res = await apiClient.get('/admin/posts'); 
        setPosts(res.data);
      } catch (err) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const toggleFeature = async (id: string, current: boolean) => {
    try {
      await apiClient.put('/admin/posts/' + id + '/feature', { isFeatured: !current });
      fetchPosts();
    } catch (e) {}
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await apiClient.delete('/admin/posts/' + id);
      fetchPosts();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feed & Stories Management</h1>
      <div className="bg-white rounded-3xl p-6">
        {loading ? <p>Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {posts.map(post => (
              <div key={post._id} className="border rounded-2xl overflow-hidden shadow-sm relative">
                <img src={post.mediaUrl} className="w-full h-48 object-cover" />
                <div className="p-3">
                  <p className="text-sm font-bold">{post.userId?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{post.caption}</p>
                  <div className="mt-3 flex justify-between">
                    <button onClick={() => toggleFeature(post._id, post.isFeatured)} className={post.isFeatured ? 'text-yellow-500' : 'text-gray-400'}><Star size={18} /></button>
                    <button onClick={() => deletePost(post._id)} className="text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}