<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { useRouter } from 'vue-router';

const valid = ref(false);
const show1 = ref(false);
const identifier = ref('');
const password = ref('');
const loginOtp = ref('');
const router = useRouter();
const authStore = useAuthStore();
const errorMsg = ref('');
const infoMsg = ref('');

// Step tracking: 1: Credentials, 2: OTP Verification
const loginStep = ref(1);

// Forgot Password Workflow Refs
const forgotDialog = ref(false);
const resetIdentifier = ref('');
const otp = ref('');
const newPassword = ref('');
const resetMsg = ref('');
const step = ref(1); // 1: Send OTP, 2: Reset

const API_BASE_URL = 'https://kairo-b1i9.onrender.com';

const handleLoginSubmit = async () => {
  try {
    errorMsg.value = '';
    const isEmail = identifier.value.includes('@');
    const payload: any = { password: password.value };
    if (isEmail) payload.email = identifier.value;
    else payload.phone = identifier.value;

    const response = await axios.post(`${API_BASE_URL}/api/admin/login`, payload);
    
    if (response.data.requireOTP) {
      loginStep.value = 2;
      infoMsg.value = "OTP has been sent to your registered contact.";
    } else if (response.data.token) {
      // Direct Login Success
      authStore.user = response.data;
      localStorage.setItem('user', JSON.stringify(response.data));
      router.push('/dashboard/default');
    }
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || "Login Failed: Invalid Credentials";
  }
};

const sendForgotOTP = async () => {
  try {
    const isEmail = resetIdentifier.value.includes('@');
    const payload: any = {};
    if (isEmail) payload.email = resetIdentifier.value;
    else payload.phone = resetIdentifier.value;

    const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, payload);
    if (response.data.success) {
      step.value = 2;
      resetMsg.value = "";
      if (response.data.otp) {
         // Show OTP directly in UI for phone if not using Twilio yet
         alert(`Debug OTP (Phone): ${response.data.otp}`);
      }
    }
  } catch (error: any) {
    resetMsg.value = error.response?.data?.message || "Failed to send OTP";
  }
};

const handleReset = async () => {
  try {
    const isEmail = resetIdentifier.value.includes('@');
    const payload: any = { otp: otp.value, newPassword: newPassword.value };
    if (isEmail) payload.email = resetIdentifier.value;
    else payload.phone = resetIdentifier.value;

    const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, payload);
    if (response.data.success) {
      alert("Password updated successfully!");
      forgotDialog.value = false;
      resetIdentifier.value = '';
      otp.value = '';
      newPassword.value = '';
      step.value = 1;
    }
  } catch (error: any) {
    resetMsg.value = error.response?.data?.message || "Reset Failed: Invalid or expired OTP";
  }
};

const identifierRules = ref([
  (v: string) => !!v || 'Required'
]);
const passwordRules = ref([
  (v: string) => !!v || 'Required',
  (v: string) => v.length >= 6 || 'Min 6 characters'
]);
</script>

<template>
  <div class="d-flex flex-column mb-2">
    <v-alert v-if="errorMsg" type="error" class="mb-4 w-100" density="compact" variant="tonal">
      {{ errorMsg }}
    </v-alert>
    <v-alert v-if="infoMsg" type="info" class="mb-4 w-100" density="compact" variant="tonal">
      {{ infoMsg }}
    </v-alert>
  </div>

  <v-form v-model="valid" class="mt-7 loginForm" @submit.prevent="handleLoginSubmit">
    <div v-if="loginStep === 1">
      <v-text-field
        v-model="identifier"
        :rules="identifierRules"
        label="Email or Mobile Number"
        class="mt-4 mb-4"
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
    </div>

    <div v-else>
      <v-text-field
        v-model="loginOtp"
        label="Enter Login OTP"
        required
        density="comfortable"
        variant="outlined"
        color="primary"
        class="mt-4 mb-4"
        placeholder="6-digit code"
      ></v-text-field>
      <v-btn color="primary" block class="mt-5" variant="flat" size="large" type="submit">Verify & Login</v-btn>
      <v-btn variant="text" block class="mt-2" @click="loginStep = 1">Back to Credentials</v-btn>
    </div>
  </v-form>

  <!-- Forgot Password Dialog -->
  <v-dialog v-model="forgotDialog" max-width="450">
    <v-card class="pa-6">
      <v-card-title class="text-h5 pb-4">Reset Password</v-card-title>
      <v-alert v-if="resetMsg" type="error" density="compact" class="mb-4">{{ resetMsg }}</v-alert>
      
      <div v-if="step === 1">
        <v-text-field v-model="resetIdentifier" label="Registered Email or Phone" variant="outlined" class="mb-2"></v-text-field>
        <v-card-actions class="px-0 pt-4">
          <v-btn color="primary" block variant="flat" @click="sendForgotOTP">Send OTP</v-btn>
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
