import mongoose from "mongoose";

const testSampleSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    autismRelation: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    methods: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    form: {
      type: Number,
      default: -1,
    },
    childFace: {
      type: Number,
      default: -1,
    },
    coloring: {
      type: Number,
      default: -1,
    },
    handWriting: {
      type: Number,
      default: -1,
    },
    drawing: {
      type: Number,
      default: -1,
    },
  },
  {
    timestamps: true,
  }
);

const testSample = mongoose.model("TestSample", testSampleSchema);
export default testSample;
