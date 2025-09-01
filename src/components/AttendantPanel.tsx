@@ -22,10 +22,12 @@ import {
 
 interface AttendantPanelProps {
   onBackToAdmin?: () => void;
+  storeSettings?: any;
 }
 
-const AttendantPanel: React.FC<AttendantPanelProps> = ({ onBackToAdmin }) => {
+const AttendantPanel: React.FC<AttendantPanelProps> = ({ onBackToAdmin, storeSettings }) => {
   const { hasPermission } = usePermissions();
+  const { storeSettings: localStoreSettings } = useStoreHours();
   const { orders, loading, updateOrderStatus } = useOrders();
   const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
   const [showManualOrderForm, setShowManualOrderForm] = useState(false);
@@ -33,6 +35,8 @@ const AttendantPanel: React.FC<AttendantPanelProps> = ({ onBackToAdmin }) => {
   const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
   const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
 
+  const settings = storeSettings || localStoreSettings;
+
   // Carregar configuração de som
   useEffect(() => {
     try {
@@ -359,6 +363,7 @@ const AttendantPanel: React.FC<AttendantPanelProps> = ({ onBackToAdmin }) => {
                 key={order.id}
                 order={order}
                 onStatusChange={updateOrderStatus}
+                storeSettings={settings}
                 isAttendant={true}
               />
             ))