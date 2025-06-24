import { Request, Response } from 'express';
import Idea, { IIdea } from '../models/Idea';

export const createIdea = async (req: Request, res: Response) => {
  try {
    const { fullName, department, phone, idea, solution } = req.body;
    
    // Generate idea code
    const initials = fullName
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase();
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000);
    const ideaCode = `${initials}-${timestamp}-${randomNum}`;

    const newIdea = new Idea({
      fullName,
      department,
      phone,
      idea,
      solution,
      ideaCode,
      submissionDate: new Date()
    });

    const savedIdea = await newIdea.save();
    res.status(201).json(savedIdea);
  } catch (error) {
    res.status(500).json({ message: 'Error creating idea', error });
  }
};

export const getAllIdeas = async (req: Request, res: Response) => {
  try {
    const { search, isPaid } = req.query;
    let query: any = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { ideaCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (isPaid !== undefined) {
      query.isPaid = isPaid === 'true';
    }

    const ideas = await Idea.find(query).sort({ submissionDate: -1 });
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ideas', error });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    const updatedIdea = await Idea.findByIdAndUpdate(
      id,
      { isPaid },
      { new: true }
    );

    if (!updatedIdea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    res.json(updatedIdea);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment status', error });
  }
};

export const updateIdea = async (req: Request, res: Response) => {
  try {
    const idea = await Idea.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng' });
    }
    res.json(idea);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

export const deleteIdea = async (req: Request, res: Response) => {
  try {
    const idea = await Idea.findByIdAndDelete(req.params.id);
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng' });
    }
    res.json({ message: 'Đã xóa ý tưởng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
}; 