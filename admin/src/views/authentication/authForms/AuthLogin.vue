<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { useRouter } from 'vue-router';

const valid = ref(false);
const show1 = ref(false);
const email = ref('');
const password = ref('');
const router = useRouter();
const authStore = useAuthStore();
const errorMsg = ref('');

// Forgot Password Workflow Refs
const forgotDialog = ref(false);
const resetEmail = ref('');
const otp = ref('');
const newPassword = ref('');
const resetMsg = ref('');
const step = ref(1); // 1: Send OTP, 2: Reset

const login = async () => {
  try {
    const response = await axios.post('https://kairo-novh.onrender.com/api/auth/login', {
      email: email.value,
      password: password.value
    });
    if (response.data.success) {
      authStore.user = response.data;
      localStorage.setItem('user', JSON.stringify(response.data));
      router.push('/dashboard/default');
    }
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || "Login Failed: Network Error or Invalid Credentials";
  }
};

const sendOTP = async () => {
  try {
    const response = await axios.post('https://kairo-novh.onrender.com/api/auth/forgot-password', {
      email: resetEmail.value
    });
    if (response.data.success) {
      step.value = 2;
      resetMsg.value = "";
      alert("OTP Sent! Check your email (Simulated for now).");
      // For development, we might show OTP in alert if backend sends it
      if(response.data.otp) console.log("OTP for test:", response.data.otp);
    }
  } catch (error: any) {
    resetMsg.value = error.response?.data?.message || "Failed to send OTP";
  }
};

const handleReset = async () => {
  try {
    const response = await axios.post('https://kairo-novh.onrender.com/api/auth/reset-password', {
      email: resetEmail.value,
      otp: otp.value,
      newPassword: newPassword.value
    });
    if (response.data.success) {
      alert("Password updated successfully!");
      forgotDialog.value = false;
      resetEmail.value = '';
      otp.value = '';
      newPassword.value = '';
      step.value = 1;
    }
  } catch (error: any) {
    resetMsg.value = error.response?.data?.message || "Reset Failed: Invalid or expired OTP";
  }
};

const emailRules = ref([
  (v: string) => !!v || 'Required',
  (v: string) => /.+@.+\..+/.test(v) || 'Invalid Email'
]);
const passwordRules = ref([
  (v: string) => !!v || 'Required',
  (v: string) => v.length >= 6 || 'Min 6 characters'
]);
</script>

<template>
  <div class="d-flex align-center justify-space-between mb-2">
    <v-alert v-if="errorMsg" type="error" class="mb-4 w-100" density="compact" variant="tonal">
      {{ errorMsg }}
    </v-alert>
  </div>
  <v-form v-model="valid" class="mt-7 loginForm" @submit.prevent="login">
    <v-text-field
      v-model="email"
      :rules="emailRules"
      label="Email Address"
      class="mt-4 mb-8"
      required
      density="comfortable"
      variant="outlined"
      color="primary"
    ></v-text-field>
    <v-text-field
      v-model="password"
      :rules="passwordRules"
      label="Password"
      required
      density="comfortable"
      variant="outlined"
      color="primary"
      :append-inner-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
      :type="show1 ? 'text' : 'password'"
      @click:append-inner="show1 = !show1"
    ></v-text-field>

    <div class="d-flex flex-wrap align-center justify-space-between ml-n2">
      <div class="ml-sm-auto">
        <a href="javascript:void(0)" @click="forgotDialog = true" class="text-primary text-decoration-none text-subtitle-1 font-weight-medium">Forgot Password?</a>
      </div>
    </div>
    <v-btn color="secondary" :disabled="!valid" block class="mt-5" variant="flat" size="large" type="submit">Sign In</v-btn>
  </v-form>

  <!-- Forgot Password Dialog -->
  <v-dialog v-model="forgotDialog" max-width="450">
    <v-card class="pa-6">
      <v-card-title class="text-h5 pb-4">Reset Password</v-card-title>
      <v-alert v-if="resetMsg" type="error" density="compact" class="mb-4">{{ resetMsg }}</v-alert>
      
      <div v-if="step === 1">
        <v-text-field v-model="resetEmail" label="Registered Email" variant="outlined" class="mb-2"></v-text-field>
        <v-card-actions class="px-0 pt-4">
          <v-btn color="primary" block variant="flat" @click="sendOTP">Send OTP</v-btn>
        </v-card-actions>
      </div>

      <div v-else>
        <v-text-field v-model="otp" label="Enter OTP" variant="outlined" class="mb-2"></v-text-field>
        <v-text-field v-model="newPassword" label="New Password" type="password" variant="outlined" class="mb-2"></v-text-field>
        <v-card-actions class="px-0 pt-4">
          <v-btn color="primary" block variant="flat" @click="handleReset">Update Password</v-btn>
          <v-btn variant="text" block class="mt-2" @click="step = 1">Back</v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</template>
