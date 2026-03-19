import { useState, useEffect } from 'react';
import { Trash2, Image as ImageIcon, Video, Clock, ShieldAlert } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { Badge } from '../../components/common/Badge';

interface Story {
  _id: string;
  userId: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewers: any[];
  expiresAt: string;
  createdAt: string;
}

export default function StoryModeration() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const res = await apiClient.get('/admin/monitoring/stories');
      setStories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to fetch stories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const deleteStory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await apiClient.delete(`/admin/monitoring/stories/${id}`);
      setStories(prev => prev.filter(s => s._id !== id));
    } catch {
      alert('Failed to delete story');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Story Moderation</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Monitor and manage user stories</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-[32px] p-20 text-center border border-gray-100 dark:border-white/5">
          <ShieldAlert className="w-16 h-16 text-gray-200 dark:text-surface-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase">No active stories</h3>
          <p className="text-gray-500">When users post stories, they will appear here for moderation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <div key={story._id} className="group bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/5 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500">
              <div className="relative aspect-[9/16] bg-gray-100 dark:bg-surface-800">
                {story.mediaType === 'video' ? (
                  <video src={story.mediaUrl} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto">
                    <img 
                      src={story.userId.profilePicture || `https://ui-avatars.com/api/?name=${story.userId.name}`} 
                      className="w-6 h-6 rounded-full border border-white/20" 
                    />
                    <span className="text-white text-xs font-bold truncate max-w-[100px]">{story.userId.name}</span>
                  </div>
                  <button 
                    onClick={() => deleteStory(story._id)}
                    className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {story.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium">{story.caption}</p>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Expires: {new Date(story.expiresAt).toLocaleTimeString()}</span>
                  </div>
                  <Badge variant={story.mediaType === 'video' ? 'info' : 'warning'}>
                    {story.mediaType === 'video' ? <Video size={12} className="mr-1 inline" /> : <ImageIcon size={12} className="mr-1 inline" />}
                    {story.mediaType}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}