import { useOrderHistory } from "@/hooks/use-order-history";
import { Table,TableHeader,TableHead,TableBody,TableCell,TableRow } from "./ui/table";
import { Order } from '@chimeralens/db';

export function OrderHistory() {
    const { data: ordersResponse, isLoading, isError } = useOrderHistory();
    const orders = ordersResponse?.data || [];

    if (isLoading) return <p>Loading order history...</p>
    if (isError) return <p className="text-destructive">Failed to load order history.</p>
    if (orders.length === 0) return <p>You haven't made any purchases yet.</p>

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order: Order) => (
                    <TableRow key={order.id}>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>+{order.credits}</TableCell>
                        <TableCell className="text-right">
                            {(order.amount / 100).toLocaleString('en-US', { style: 'currency', currency: order.currency.toUpperCase() })}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}