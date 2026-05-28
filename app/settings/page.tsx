"use client";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Bell,
  Shield,
  Trash2,
  Camera,
  Plus,
  X,
  Save,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Navbar } from "@/components/navbar";
import { ProtectedRoute } from "@/components/protected-route";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

// Types
interface Skill { id: string; name: string; }
interface Experience { id: string; title: string; company: string; duration: string; current: boolean; }
interface Education { id: string; degree: string; school: string; year: string; }
interface Profile {
  firstName: string; lastName: string; email: string; phone: string; location: string;
  title: string; bio: string; avatarUrl?: string;
}
interface Notifications { emailAlerts: boolean; jobMatches: boolean; weeklyDigest: boolean; applicationUpdates: boolean; marketingEmails: boolean; }
interface Privacy { profileVisible: boolean; showEmail: boolean; showPhone: boolean; allowDataCollection: boolean; }

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}

function SettingsPageContent() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  
  const [profile, setProfile] = React.useState<Profile>({
    firstName: "", lastName: "", email: "", phone: "", location: "", title: "", bio: "", avatarUrl: "",
  });
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [newSkill, setNewSkill] = React.useState("");
  const [experiences, setExperiences] = React.useState<Experience[]>([]);
  const [newExp, setNewExp] = React.useState<Partial<Experience>>({});
  const [education, setEducation] = React.useState<Education[]>([]);
  const [newEdu, setNewEdu] = React.useState<Partial<Education>>({});
  const [notifications, setNotifications] = React.useState<Notifications>({
    emailAlerts: true, jobMatches: true, weeklyDigest: false, applicationUpdates: true, marketingEmails: false,
  });
  const [privacy, setPrivacy] = React.useState<Privacy>({
    profileVisible: true, showEmail: false, showPhone: false, allowDataCollection: true,
  });
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showAddExpModal, setShowAddExpModal] = React.useState(false);
  const [showAddEduModal, setShowAddEduModal] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; type: string } | null>(null);

  const showToast = (message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUserData = async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("No user logged in");
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (profileData) {
      setProfile({
        firstName: profileData.first_name || profileData.full_name?.split(" ")?.[0] || "",
        lastName: profileData.last_name || "",
        email: profileData.email || user.email || "",
        phone: profileData.phone || "",
        location: profileData.location || "",
        title: profileData.title || "",
        bio: profileData.bio || "",
        avatarUrl: profileData.avatar_url,
      });
      if (profileData.notifications) setNotifications(profileData.notifications);
      if (profileData.privacy) setPrivacy(profileData.privacy);
    } else {
      await supabase.from("profiles").insert([{ id: user.id, email: user.email, first_name: user.email?.split("@")[0] }]);
      setProfile((prev) => ({ ...prev, email: user.email || "", firstName: user.email?.split("@")[0] || "" }));
    }

    const { data: skillsData } = await supabase.from("skills").select("*").eq("user_id", user.id);
    if (skillsData) setSkills(skillsData.map((s: any) => ({ id: s.id, name: s.name || s.skill_name })));

    const { data: expData } = await supabase.from("experiences").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (expData) setExperiences(expData);

    const { data: eduData } = await supabase.from("education").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (eduData) setEducation(eduData);

    setLoading(false);
  };

  React.useEffect(() => { loadUserData(); }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, file, { upsert: true });
    if (uploadError) {
      showToast("Upload failed", "error");
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(filePath);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    setProfile({ ...profile, avatarUrl: publicUrl });
    showToast("Avatar updated");
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await apiClient('/api/user/profile', {
        method: 'PUT',
        body: { profile, skills, experiences, education, notifications, privacy },
      });
    } catch (error) {
      setSaving(false);
      showToast(error instanceof Error ? error.message : "Failed to save profile", "error");
      return;
    }

    setSaving(false);
    showToast("All changes saved");
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) setSkills([...skills, { id: `temp-${Date.now()}`, name: newSkill.trim() }]);
    setNewSkill("");
  };
  const handleRemoveSkill = (id: string) => setSkills(skills.filter(s => s.id !== id));
  const handleAddExperience = (exp: Partial<Experience>) => {
    if (exp.title && exp.company) {
      setExperiences([...experiences, { id: `temp-${Date.now()}`, title: exp.title!, company: exp.company!, duration: exp.duration || "", current: exp.current || false }]);
      setNewExp({}); setShowAddExpModal(false);
    }
  };
  const handleRemoveExperience = (id: string) => setExperiences(experiences.filter(e => e.id !== id));
  const handleAddEducation = (edu: Partial<Education>) => {
    if (edu.degree && edu.school) {
      setEducation([...education, { id: `temp-${Date.now()}`, degree: edu.degree!, school: edu.school!, year: edu.year || "" }]);
      setNewEdu({}); setShowAddEduModal(false);
    }
  };
  const handleRemoveEducation = (id: string) => setEducation(education.filter(e => e.id !== id));

  const deleteAccount = async () => {
    try {
      await apiClient('/api/delete-account', { method: 'DELETE' });
      router.push('/auth/login');
    } catch {
      showToast("Failed to delete account", "error");
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-background"><Navbar /><div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div></main>
  );

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {toast && <div className="fixed top-24 right-4 z-50 p-3 rounded-lg bg-green-500 text-white">{toast.message}</div>}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Settings</span></h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted">
                    {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" /> : <User className="w-12 h-12 m-6" />}
                  </div>
                  <div>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} id="avatar-upload" className="hidden" />
                    <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={uploadingAvatar}>
                      <Camera className="w-4 h-4 mr-2" /> {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                    </Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium">First Name</label><Input value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} /></div>
                  <div><label className="text-sm font-medium">Last Name</label><Input value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} /></div>
                  <div><label className="text-sm font-medium">Email</label><Input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} /></div>
                  <div><label className="text-sm font-medium">Phone</label><Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} /></div>
                  <div><label className="text-sm font-medium">Location</label><Input value={profile.location} onChange={(e) => setProfile({...profile, location: e.target.value})} /></div>
                  <div><label className="text-sm font-medium">Professional Title</label><Input value={profile.title} onChange={(e) => setProfile({...profile, title: e.target.value})} /></div>
                </div>
                <div><label className="text-sm font-medium">Bio</label><Textarea rows={3} value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} /></div>
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle>Skills</CardTitle></CardHeader><CardContent>
              <div className="flex flex-wrap gap-2 mb-4">{skills.map(skill => (<span key={skill.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10">{skill.name}<button onClick={() => handleRemoveSkill(skill.id)}><X className="h-3 w-3" /></button></span>))}</div>
              <div className="flex gap-2"><Input placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddSkill()} /><Button variant="outline" onClick={handleAddSkill}><Plus className="h-4 w-4" /></Button></div>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Work Experience</CardTitle></CardHeader><CardContent>
              <div className="space-y-4">{experiences.map(exp => (<div key={exp.id} className="flex justify-between items-start p-3 border rounded-lg"><div><p className="font-semibold">{exp.title}</p><p className="text-sm text-muted-foreground">{exp.company}</p><p className="text-xs">{exp.duration}</p>{exp.current && <span className="text-xs text-green-600">Current</span>}</div><Button variant="ghost" size="sm" onClick={() => handleRemoveExperience(exp.id)}><X className="h-4 w-4" /></Button></div>))}</div>
              <Button variant="outline" className="mt-4" onClick={() => setShowAddExpModal(true)}><Plus className="h-4 w-4 mr-2" /> Add Experience</Button>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Education</CardTitle></CardHeader><CardContent>
              <div className="space-y-4">{education.map(edu => (<div key={edu.id} className="flex justify-between items-start p-3 border rounded-lg"><div><p className="font-semibold">{edu.degree}</p><p className="text-sm">{edu.school}</p><p className="text-xs">{edu.year}</p></div><Button variant="ghost" size="sm" onClick={() => handleRemoveEducation(edu.id)}><X className="h-4 w-4" /></Button></div>))}</div>
              <Button variant="outline" className="mt-4" onClick={() => setShowAddEduModal(true)}><Plus className="h-4 w-4 mr-2" /> Add Education</Button>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent>
              {Object.entries(notifications).map(([key, value]) => (<div key={key} className="flex justify-between items-center py-2"><span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span><Switch checked={value} onCheckedChange={(checked) => setNotifications({...notifications, [key]: checked})} /></div>))}
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Privacy</CardTitle></CardHeader><CardContent>
              {Object.entries(privacy).map(([key, value]) => (<div key={key} className="flex justify-between items-center py-2"><span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span><Switch checked={value} onCheckedChange={(checked) => setPrivacy({...privacy, [key]: checked})} /></div>))}
            </CardContent></Card>

            <div className="flex justify-between items-center">
              <Button variant="destructive" onClick={() => setShowDeleteModal(true)}><Trash2 className="h-4 w-4 mr-2" /> Delete Account</Button>
              <Button size="lg" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}</Button>
            </div>
          </div>
        </div>
      </div>

      {showAddExpModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Card className="w-full max-w-md"><CardHeader><CardTitle>Add Experience</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Title" onChange={(e) => setNewExp({...newExp, title: e.target.value})} /><Input placeholder="Company" onChange={(e) => setNewExp({...newExp, company: e.target.value})} /><Input placeholder="Duration" onChange={(e) => setNewExp({...newExp, duration: e.target.value})} /><div className="flex items-center gap-2"><Switch onCheckedChange={(val) => setNewExp({...newExp, current: val})} /><span>Current job</span></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddExpModal(false)}>Cancel</Button><Button onClick={() => handleAddExperience(newExp)}>Add</Button></div></CardContent></Card></div>)}
      {showAddEduModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Card className="w-full max-w-md"><CardHeader><CardTitle>Add Education</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Degree" onChange={(e) => setNewEdu({...newEdu, degree: e.target.value})} /><Input placeholder="School" onChange={(e) => setNewEdu({...newEdu, school: e.target.value})} /><Input placeholder="Year" onChange={(e) => setNewEdu({...newEdu, year: e.target.value})} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddEduModal(false)}>Cancel</Button><Button onClick={() => handleAddEducation(newEdu)}>Add</Button></div></CardContent></Card></div>)}
      {showDeleteModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Card className="w-full max-w-md"><CardContent className="p-6"><div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-destructive" /></div><div><h3 className="text-lg font-semibold">Delete Account</h3><p className="text-sm text-muted-foreground">This action cannot be undone</p></div></div><p className="text-muted-foreground mb-6">All your data will be permanently removed.</p><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="destructive" onClick={deleteAccount}>Yes, Delete My Account</Button></div></CardContent></Card></div>)}
    </main>
  );
}
