import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Save } from "lucide-react";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  company: z.string().optional(),
  website: z.string().url("Please enter a valid URL.").optional().or(z.string().length(0)),
});

// Email settings form schema
const emailSettingsSchema = z.object({
  senderName: z.string().min(2, "Sender name is required."),
  senderEmail: z.string().email("Please enter a valid email address."),
  replyToEmail: z.string().email("Please enter a valid email address."),
  defaultFooter: z.string().optional(),
  includeUnsubscribeLink: z.boolean().default(true),
});

// SMTP settings form schema
const smtpSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required."),
  smtpPort: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Port must be a number.",
  }),
  smtpUsername: z.string().min(1, "SMTP username is required."),
  smtpPassword: z.string().min(1, "SMTP password is required."),
  useTLS: z.boolean().default(true),
});

// API Keys form schema
const apiKeysSchema = z.object({
  apiKey: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
type SmtpSettingsValues = z.infer<typeof smtpSettingsSchema>;
type ApiKeysValues = z.infer<typeof apiKeysSchema>;

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      website: "",
    },
  });
  
  // Email settings form
  const emailSettingsForm = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      senderName: "",
      senderEmail: "",
      replyToEmail: "",
      defaultFooter: "",
      includeUnsubscribeLink: true,
    },
  });
  
  // SMTP settings form
  const smtpSettingsForm = useForm<SmtpSettingsValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: "587",
      smtpUsername: "",
      smtpPassword: "",
      useTLS: true,
    },
  });
  
  // API keys form
  const apiKeysForm = useForm<ApiKeysValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/settings/profile"],
    onSuccess: (data) => {
      profileForm.reset({
        name: data.name || "",
        email: data.email || "",
        company: data.company || "",
        website: data.website || "",
      });
    },
  });

  // Fetch email settings
  const { data: emailSettingsData, isLoading: isLoadingEmailSettings } = useQuery({
    queryKey: ["/api/settings/email"],
    onSuccess: (data) => {
      emailSettingsForm.reset({
        senderName: data.senderName || "",
        senderEmail: data.senderEmail || "",
        replyToEmail: data.replyToEmail || "",
        defaultFooter: data.defaultFooter || "",
        includeUnsubscribeLink: data.includeUnsubscribeLink !== false,
      });
    },
  });

  // Fetch SMTP settings
  const { data: smtpSettingsData, isLoading: isLoadingSmtpSettings } = useQuery({
    queryKey: ["/api/settings/smtp"],
    onSuccess: (data) => {
      smtpSettingsForm.reset({
        smtpHost: data.smtpHost || "",
        smtpPort: String(data.smtpPort) || "587",
        smtpUsername: data.smtpUsername || "",
        smtpPassword: data.smtpPassword || "",
        useTLS: data.useTLS !== false,
      });
    },
  });

  // Fetch API keys
  const { data: apiKeysData, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ["/api/settings/apiKeys"],
    onSuccess: (data) => {
      apiKeysForm.reset({
        apiKey: data.apiKey || "",
      });
    },
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      return apiRequest("PATCH", "/api/settings/profile", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update email settings mutation
  const updateEmailSettings = useMutation({
    mutationFn: async (values: EmailSettingsValues) => {
      return apiRequest("PATCH", "/api/settings/email", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/email"] });
      toast({
        title: "Email settings updated",
        description: "Your email settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update email settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update SMTP settings mutation
  const updateSmtpSettings = useMutation({
    mutationFn: async (values: SmtpSettingsValues) => {
      return apiRequest("PATCH", "/api/settings/smtp", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/smtp"] });
      toast({
        title: "SMTP settings updated",
        description: "Your SMTP settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update SMTP settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Test SMTP connection mutation
  const testSmtpConnection = useMutation({
    mutationFn: async (values: SmtpSettingsValues) => {
      return apiRequest("POST", "/api/settings/smtp/test", values);
    },
    onSuccess: () => {
      toast({
        title: "Connection successful",
        description: "Your SMTP settings are working correctly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: `SMTP test failed: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Generate new API key mutation
  const generateApiKey = useMutation({
    mutationFn: async () => {
      setIsGeneratingApiKey(true);
      return apiRequest("POST", "/api/settings/apiKeys/generate", {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/apiKeys"] });
      apiKeysForm.setValue("apiKey", data.apiKey);
      toast({
        title: "API key generated",
        description: "A new API key has been generated. Save it securely.",
      });
      setIsGeneratingApiKey(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate API key: ${error.message}`,
        variant: "destructive",
      });
      setIsGeneratingApiKey(false);
    },
  });

  // Form submission handlers
  const onSubmitProfile = (values: ProfileFormValues) => {
    updateProfile.mutate(values);
  };

  const onSubmitEmailSettings = (values: EmailSettingsValues) => {
    updateEmailSettings.mutate(values);
  };

  const onSubmitSmtpSettings = (values: SmtpSettingsValues) => {
    updateSmtpSettings.mutate(values);
  };

  const handleTestSmtpConnection = () => {
    const values = smtpSettingsForm.getValues();
    testSmtpConnection.mutate(values);
  };

  const handleGenerateApiKey = () => {
    // Confirm with user
    if (window.confirm("Are you sure you want to generate a new API key? This will invalidate any existing key.")) {
      generateApiKey.mutate();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-800 mb-1">Settings</h1>
        <p className="text-neutral-600">Manage your account and application settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="email">Email Settings</TabsTrigger>
          <TabsTrigger value="smtp">SMTP Configuration</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://example.com" />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="flex items-center"
                    >
                      {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure your default email settings for campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEmailSettings ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...emailSettingsForm}>
                  <form onSubmit={emailSettingsForm.handleSubmit(onSubmitEmailSettings)} className="space-y-6">
                    <FormField
                      control={emailSettingsForm.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Sender Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            This name will appear as the sender of your email campaigns
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailSettingsForm.control}
                      name="senderEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Sender Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailSettingsForm.control}
                      name="replyToEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Reply-To Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailSettingsForm.control}
                      name="defaultFooter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Email Footer</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder="© 2023 Your Company. All rights reserved."
                            />
                          </FormControl>
                          <FormDescription>
                            This footer will be added to all your email campaigns
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailSettingsForm.control}
                      name="includeUnsubscribeLink"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Unsubscribe Link
                            </FormLabel>
                            <FormDescription>
                              Automatically include an unsubscribe link in all emails
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={updateEmailSettings.isPending}
                      className="flex items-center"
                    >
                      {updateEmailSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Email Settings
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Configuration */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure your SMTP server for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSmtpSettings ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...smtpSettingsForm}>
                  <form onSubmit={smtpSettingsForm.handleSubmit(onSubmitSmtpSettings)} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={smtpSettingsForm.control}
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="smtp.example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smtpSettingsForm.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Port</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="587" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={smtpSettingsForm.control}
                      name="smtpUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpSettingsForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="••••••••" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpSettingsForm.control}
                      name="useTLS"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Use TLS
                            </FormLabel>
                            <FormDescription>
                              Enable TLS encryption for secure email transmission
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        disabled={updateSmtpSettings.isPending}
                        className="flex items-center"
                      >
                        {updateSmtpSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save SMTP Settings
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={testSmtpConnection.isPending}
                        onClick={handleTestSmtpConnection}
                        className="flex items-center"
                      >
                        {testSmtpConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Test Connection
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for integrating with external applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApiKeys ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      API keys provide full access to your account. Keep them secure and never share them in client-side code.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Your API Key</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={apiKeysForm.watch("apiKey") || "No API key generated"}
                        readOnly
                        className="font-mono"
                      />
                      {apiKeysForm.watch("apiKey") && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            navigator.clipboard.writeText(apiKeysForm.watch("apiKey") || "");
                            toast({
                              title: "Copied",
                              description: "API key copied to clipboard",
                            });
                          }}
                          className="whitespace-nowrap"
                        >
                          Copy
                        </Button>
                      )}
                    </div>
                    
                    {apiKeysForm.watch("apiKey") && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Created: {apiKeysData?.createdAt ? new Date(apiKeysData.createdAt).toLocaleDateString() : "Unknown"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Last used: {apiKeysData?.lastUsedAt ? new Date(apiKeysData.lastUsedAt).toLocaleDateString() : "Never"}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleGenerateApiKey}
                    disabled={isGeneratingApiKey}
                    variant="outline"
                    className="flex items-center"
                  >
                    {isGeneratingApiKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {apiKeysForm.watch("apiKey") ? "Regenerate API Key" : "Generate New API Key"}
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <h3 className="text-sm font-medium mb-2">Example Usage</h3>
              <pre className="bg-neutral-100 p-4 rounded-md text-sm w-full overflow-x-auto">
                {`curl -X GET "https://api.yourdomain.com/v1/contacts" \\
  -H "Authorization: Bearer ${apiKeysForm.watch("apiKey") || "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json"`}
              </pre>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
