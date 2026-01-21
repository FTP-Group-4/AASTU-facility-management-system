export const mockReports = [
    {
        id: 'R-001',
        summary: 'Broken Ceiling Fan',
        description: 'The ceiling fan in Room 304 makes a loud grinding noise and wobbles dangerously when turned on. It seems like a bearing issue.',
        location: 'Block 57, Room 304',
        status: 'pending', // pending, in_progress, completed
        category: 'Electrical',
        date: '2 hours ago',
        assignedTo: null,
        photos: ['https://via.placeholder.com/150']
    },
    {
        id: 'R-002',
        summary: 'Leaking Faucet in Restroom',
        description: 'The second faucet from the left in the 2nd floor men\'s restroom is leaking constantly, causing water wastage.',
        location: 'Library, 2nd Floor Restroom',
        status: 'in_progress',
        category: 'Plumbing',
        date: '1 day ago',
        assignedTo: 'Chala Muhe',
        photos: []
    },
    {
        id: 'R-003',
        summary: 'Projector Not Connecting',
        description: 'The HDMI port on the projector in Lecture Hall 1 is loose and does not maintain a steady connection.',
        location: 'Block 09, Hall 1',
        status: 'completed',
        category: 'IT Infrastructure',
        date: '3 days ago',
        assignedTo: 'Tech Support Team',
        photos: []
    }
];
