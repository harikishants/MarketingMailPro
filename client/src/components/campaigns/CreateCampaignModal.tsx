import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject line is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Invalid email address"),
  replyToEmail: z.string().email("Invalid email address"),
  listId: z.string().min(1, "Contact list is required"),
  content: z.string().optional(),
  templateId: z.string().optional(),
  scheduleType: z.enum(["now", "later"]),
  scheduledDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCampaignModal = ({ open, onOpenChange }: CreateCampaignModalProps) => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subject: "",
      senderName: "",
      senderEmail: "",
      replyToEmail: "",
      listId: "",
      content: "",
      templateId: "",
      scheduleType: "now",
      scheduledDate: "",
    },
  });

  const { data: contactLists } = useQuery({
    queryKey: ["/api/contactLists"],
    enabled: open,
  });

  const { data: templates } = useQuery({
    queryKey: ["/api/templates"],
    enabled: open && step === 3,
  });

  const createCampaign = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest("POST", "/api/campaigns", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/recent"] });
      toast({
        title: "Campaign created",
        description: values.scheduleType === "now" 
          ? "Your campaign has been sent" 
          : "Your campaign has been scheduled",
      });
      setStep(1);
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const { 
    formState: { errors },
    handleSubmit, 
    watch,
    setValue 
  } = form;

  const values = watch();

  const onSubmit = (values: FormValues) => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      createCampaign.mutate(values);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    setStep(1);
    form.reset();
    onOpenChange(false);
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s === step 
                  ? "bg-primary text-white" 
                  : s < step 
                    ? "bg-primary text-white" 
                    : "bg-neutral-100 text-neutral-600"
              }`}
            >
              <span>{s}</span>
            </div>
            <div className="ml-2">
              <p className={`text-sm font-medium ${
                s === step 
                  ? "text-neutral-800" 
                  : "text-neutral-600"
              }`}>
                {s === 1 && "Campaign Details"}
                {s === 2 && "Select Audience"}
                {s === 3 && "Design Email"}
                {s === 4 && "Schedule"}
              </p>
            </div>
            {s < 4 && <div className="flex-1 h-1 bg-neutral-100 mx-4"></div>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Campaign</DialogTitle>
        </DialogHeader>
        
        {renderStepIndicator()}
        
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is for your internal reference only.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email subject line" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will appear as the subject of your email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter sender name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter sender email address" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="replyToEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply-to Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter reply-to email address" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {step === 2 && (
              <FormField
                control={form.control}
                name="listId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Contact List</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact list" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactLists?.map((list: any) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name} ({list.contactCount} contacts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {step === 3 && (
              <>
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Template</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value || ''} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template or create from scratch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Create from scratch</SelectItem>
                            {templates?.map((template: any) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write your email content here or select a template above" 
                          className="min-h-[200px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        You can use HTML or plain text. Use [name] to personalize.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {step === 4 && (
              <>
                <FormField
                  control={form.control}
                  name="scheduleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>When to send?</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "later" && !values.scheduledDate) {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              setValue("scheduledDate", tomorrow.toISOString().split('T')[0]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="now">Send immediately</SelectItem>
                            <SelectItem value="later">Schedule for later</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {values.scheduleType === "later" && (
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <div>
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={handlePrevious}>
                      Previous
                    </Button>
                  )}
                </div>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCampaign.isPending}>
                    {step < 4 ? "Continue" : "Create Campaign"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignModal;
